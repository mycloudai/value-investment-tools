import YAML from 'yaml';
import { categoryMeta, getDefaultValues, toolCatalog, type InputField, type ToolDefinition } from './toolkit';

export const PUBLIC_BASE_URL = 'https://value-investment-tools.mycloudai.org';

const AI_KIND_PREFIX = 'mycloudai.value-investment';

export interface NormalizedToolInputs {
  values: Record<string, number | string>;
  warnings: string[];
}

const toolInputAliases: Record<string, Record<string, string>> = {
  'dcf-monte-carlo': {
    growthRateMean: 'growthMean',
    growthRateStd: 'growthStd',
    simulations: 'iterations',
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const safeString = (value: unknown) => String(value ?? '').trim();

const safeNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(safeString(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeFieldValue = (field: InputField, input: unknown) => {
  if (field.type === 'number') {
    return safeNumber(input);
  }

  if (field.type === 'select' || field.type === 'series' || field.type === 'textarea') {
    return safeString(input);
  }

  return safeString(input);
};

const pickInputPayload = (payload: unknown) => {
  if (isRecord(payload) && isRecord(payload.inputs)) {
    return payload.inputs;
  }

  if (isRecord(payload)) {
    return payload;
  }

  return {};
};

const buildFieldSchema = (field: InputField) => ({
  key: field.key,
  label: field.label,
  description: field.description,
  type: field.type,
  default: field.defaultValue,
  min: field.min,
  max: field.max,
  step: field.step,
  unit: field.unit,
  placeholder: field.placeholder,
  sensitivity: field.sensitivity ?? false,
  options: field.options,
});

export const aiEnabledTools = toolCatalog.filter(
  (tool): tool is ToolDefinition & { compute: NonNullable<ToolDefinition['compute']> } => typeof tool.compute === 'function',
);

export const findAiTool = (category: string | undefined, slug: string | undefined) =>
  aiEnabledTools.find((tool) => tool.category === category && tool.slug === slug);

export const normalizeToolInputs = (tool: ToolDefinition, payload: unknown): NormalizedToolInputs => {
  const defaults = getDefaultValues(tool);
  const rawInputs = pickInputPayload(payload);
  const values = { ...defaults };
  const warnings: string[] = [];
  const aliases = toolInputAliases[tool.slug] ?? {};

  tool.fields.forEach((field) => {
    const sourceKey = field.key in rawInputs ? field.key : Object.keys(aliases).find((alias) => aliases[alias] === field.key && alias in rawInputs);
    if (!sourceKey) {
      return;
    }

    const normalized = normalizeFieldValue(field, rawInputs[sourceKey]);
    values[field.key] = normalized;

    if (sourceKey !== field.key) {
      warnings.push(`字段 ${sourceKey} 已映射为 ${field.key}。`);
    }

    if (field.type === 'number' && typeof rawInputs[sourceKey] !== 'number' && safeString(rawInputs[sourceKey]) !== '') {
      warnings.push(`字段 ${field.key} 已按数字解析。`);
    }
  });

  if (isRecord(payload) && isRecord(payload.tool)) {
    const declaredSlug = safeString(payload.tool.slug);
    if (declaredSlug && declaredSlug !== tool.slug) {
      warnings.push(`请求中的 tool.slug=${declaredSlug} 与目标工具 ${tool.slug} 不一致，已按 URL 指定工具计算。`);
    }
  }

  return { values, warnings };
};

export const parseToolYamlPayload = (text: string) => YAML.parse(text) as unknown;

export const buildToolApiLinks = (tool: ToolDefinition, baseUrl = PUBLIC_BASE_URL) => ({
  schemaYaml: `${baseUrl}/api/tools/${tool.category}/${tool.slug}/schema.yaml`,
  schemaJson: `${baseUrl}/api/tools/${tool.category}/${tool.slug}/schema.json`,
  computeYaml: `${baseUrl}/api/tools/${tool.category}/${tool.slug}/compute.yaml`,
  computeJson: `${baseUrl}/api/tools/${tool.category}/${tool.slug}/compute.json`,
});

export const buildToolInputDocument = (
  tool: ToolDefinition,
  values: Record<string, number | string>,
  baseUrl = PUBLIC_BASE_URL,
) => ({
  kind: `${AI_KIND_PREFIX}.tool-input`,
  version: 1,
  tool: {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    category: tool.category,
    route: `${baseUrl}${tool.route}`,
  },
  inputs: tool.fields.reduce<Record<string, number | string>>((state, field) => {
    state[field.key] = values[field.key] ?? field.defaultValue;
    return state;
  }, {}),
});

export const buildToolSchemaDocument = (tool: ToolDefinition, baseUrl = PUBLIC_BASE_URL) => ({
  kind: `${AI_KIND_PREFIX}.tool-schema`,
  version: 1,
  tool: {
    id: tool.id,
    name: tool.name,
    shortName: tool.shortName,
    slug: tool.slug,
    category: tool.category,
    route: `${baseUrl}${tool.route}`,
    priority: tool.priority,
  },
  category: {
    key: tool.category,
    label: categoryMeta[tool.category].label,
    summary: categoryMeta[tool.category].summary,
  },
  purpose: tool.purpose,
  scenario: tool.scenario,
  formula: tool.formula,
  limitations: tool.limitations,
  variables: tool.variables,
  api: buildToolApiLinks(tool, baseUrl),
  fieldSchema: tool.fields.map(buildFieldSchema),
  exampleInput: buildToolInputDocument(tool, getDefaultValues(tool), baseUrl),
});

export const buildToolSchemaYaml = (tool: ToolDefinition, baseUrl = PUBLIC_BASE_URL) => YAML.stringify(buildToolSchemaDocument(tool, baseUrl), { lineWidth: 0 });

export const computeToolPayload = (tool: ToolDefinition, payload: unknown) => {
  if (!tool.compute) {
    throw new Error(`工具 ${tool.slug} 不支持计算接口。`);
  }

  const { values, warnings } = normalizeToolInputs(tool, payload);
  const result = tool.compute(values);

  return {
    kind: `${AI_KIND_PREFIX}.tool-result`,
    version: 1,
    computedAt: new Date().toISOString(),
    tool: {
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      category: tool.category,
    },
    warnings,
    inputs: values,
    summary: result.summary,
    details: result.details,
    narrative: result.narrative,
    charts: result.charts,
  };
};

export const buildToolResultYaml = (tool: ToolDefinition, payload: unknown) => YAML.stringify(computeToolPayload(tool, payload), { lineWidth: 0 });

export const buildAiManifestDocument = (baseUrl = PUBLIC_BASE_URL) => ({
  kind: `${AI_KIND_PREFIX}.manifest`,
  version: 1,
  name: 'MyCloudAI Value Investment Tools',
  description: 'AI-ready value investing calculators with YAML schemas, YAML/JSON compute APIs, and tool discovery endpoints.',
  domain: baseUrl,
  openapi: `${baseUrl}/openapi.json`,
  sitemap: `${baseUrl}/sitemap.xml`,
  robots: `${baseUrl}/robots.txt`,
  discovery: {
    manifest: `${baseUrl}/api/ai/manifest.json`,
    toolsYaml: `${baseUrl}/api/ai/tools.yaml`,
  },
  usage: [
    '先读取 /api/ai/tools.yaml 获取工具清单。',
    '再读取某个工具的 schema.yaml，确认字段、默认值与说明。',
    '将 inputs 调整后 POST 到 compute.yaml 或 compute.json 获取结果。',
  ],
});

export const buildAiManifestJson = (baseUrl = PUBLIC_BASE_URL) => buildAiManifestDocument(baseUrl);

export const buildAiToolsDocument = (baseUrl = PUBLIC_BASE_URL) => ({
  kind: `${AI_KIND_PREFIX}.tool-index`,
  version: 1,
  tools: aiEnabledTools.map((tool) => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    shortName: tool.shortName,
    category: tool.category,
    priority: tool.priority,
    purpose: tool.purpose,
    scenario: tool.scenario,
    route: `${baseUrl}${tool.route}`,
    ...buildToolApiLinks(tool, baseUrl),
  })),
});

export const buildAiToolsYaml = (baseUrl = PUBLIC_BASE_URL) => YAML.stringify(buildAiToolsDocument(baseUrl), { lineWidth: 0 });

export const getIndexableRoutes = () => [
  '/',
  '/data',
  ...Object.keys(categoryMeta).map((category) => `/${category}`),
  ...toolCatalog.map((tool) => tool.route),
];

export const buildOpenApiDocument = (baseUrl = PUBLIC_BASE_URL) => ({
  openapi: '3.1.0',
  info: {
    title: 'MyCloudAI Value Investment Tools API',
    version: '1.0.0',
    description: 'Discovery and compute API for YAML/JSON driven value investing tools.',
  },
  servers: [{ url: baseUrl }],
  paths: {
    '/api/ai/manifest.json': {
      get: {
        summary: 'Read the AI manifest',
        responses: {
          '200': {
            description: 'AI manifest JSON',
          },
        },
      },
    },
    '/api/ai/tools.yaml': {
      get: {
        summary: 'List all compute-capable tools in YAML',
        responses: {
          '200': {
            description: 'Tool index YAML',
          },
        },
      },
    },
    '/api/tools/{category}/{slug}/schema.yaml': {
      get: {
        summary: 'Get the YAML schema for a specific tool',
        parameters: [
          { name: 'category', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Tool schema YAML',
          },
        },
      },
    },
    '/api/tools/{category}/{slug}/compute.yaml': {
      post: {
        summary: 'Compute a tool from YAML input',
        parameters: [
          { name: 'category', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/yaml': {
              schema: { type: 'string' },
            },
            'text/yaml': {
              schema: { type: 'string' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tool result YAML',
          },
        },
      },
    },
    '/api/tools/{category}/{slug}/compute.json': {
      post: {
        summary: 'Compute a tool from JSON input',
        parameters: [
          { name: 'category', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tool result JSON',
          },
        },
      },
    },
  },
});