import {
  PUBLIC_BASE_URL,
  buildAiManifestJson,
  buildAiToolsYaml,
  buildOpenApiDocument,
  buildToolResultYaml,
  buildToolSchemaDocument,
  buildToolSchemaYaml,
  computeToolPayload,
  findAiTool,
  getIndexableRoutes,
  parseToolYamlPayload,
} from './lib/ai-native';

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      ...(init.headers ?? {}),
    },
  });

const textResponse = (body: string, contentType: string, init: ResponseInit = {}) =>
  new Response(body, {
    ...init,
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=300',
      ...(init.headers ?? {}),
    },
  });

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildSitemapXml = () => {
  const routes = getIndexableRoutes();
  const lastModified = new Date().toISOString();
  const urls = routes
    .map(
      (route) =>
        `<url><loc>${escapeXml(`${PUBLIC_BASE_URL}${route}`)}</loc><lastmod>${lastModified}</lastmod><changefreq>weekly</changefreq></url>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
};

const buildRobotsText = () => `User-agent: *\nAllow: /\nSitemap: ${PUBLIC_BASE_URL}/sitemap.xml\n`;

const readRequestPayload = async (request: Request) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return request.json();
  }

  return parseToolYamlPayload(await request.text());
};

const notFound = () => jsonResponse({ error: 'Not Found' }, { status: 404 });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/ai/manifest.json' && request.method === 'GET') {
      return jsonResponse(buildAiManifestJson());
    }

    if (path === '/api/ai/tools.yaml' && request.method === 'GET') {
      return textResponse(buildAiToolsYaml(), 'application/yaml; charset=utf-8');
    }

    if (path === '/openapi.json' && request.method === 'GET') {
      return jsonResponse(buildOpenApiDocument());
    }

    if (path === '/sitemap.xml' && request.method === 'GET') {
      return textResponse(buildSitemapXml(), 'application/xml; charset=utf-8');
    }

    if (path === '/robots.txt' && request.method === 'GET') {
      return textResponse(buildRobotsText(), 'text/plain; charset=utf-8');
    }

    const schemaMatch = path.match(/^\/api\/tools\/([^/]+)\/([^/]+)\/schema\.(yaml|json)$/);
    if (schemaMatch && request.method === 'GET') {
      const [, category, slug, format] = schemaMatch;
      const tool = findAiTool(category, slug);
      if (!tool) {
        return notFound();
      }

      if (format === 'json') {
        return jsonResponse(buildToolSchemaDocument(tool));
      }

      return textResponse(buildToolSchemaYaml(tool), 'application/yaml; charset=utf-8');
    }

    const computeMatch = path.match(/^\/api\/tools\/([^/]+)\/([^/]+)\/compute\.(yaml|json)$/);
    if (computeMatch && request.method === 'POST') {
      const [, category, slug, format] = computeMatch;
      const tool = findAiTool(category, slug);
      if (!tool) {
        return notFound();
      }

      try {
        const payload = await readRequestPayload(request);
        if (format === 'json') {
          return jsonResponse(computeToolPayload(tool, payload));
        }

        return textResponse(buildToolResultYaml(tool, payload), 'application/yaml; charset=utf-8');
      } catch (error) {
        return jsonResponse(
          {
            error: error instanceof Error ? error.message : 'Invalid request payload',
          },
          { status: 400 },
        );
      }
    }

    if (path.startsWith('/api/')) {
      return notFound();
    }

    return env.ASSETS.fetch(request);
  },
};