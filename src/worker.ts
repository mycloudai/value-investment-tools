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

const isReadMethod = (method: string) => method === 'GET' || method === 'HEAD';

const responseHeaders = (contentType: string, init: ResponseInit = {}) => ({
  'content-type': contentType,
  'cache-control': 'public, max-age=300',
  ...(init.headers ?? {}),
});

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers: responseHeaders('application/json; charset=utf-8', init),
  });

const textResponse = (body: string, contentType: string, init: ResponseInit = {}) =>
  new Response(body, {
    ...init,
    headers: responseHeaders(contentType, init),
  });

const emptyResponse = (contentType: string, init: ResponseInit = {}) =>
  new Response(null, {
    ...init,
    headers: responseHeaders(contentType, init),
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

    if (path === '/api/ai/manifest.json' && isReadMethod(request.method)) {
      return request.method === 'HEAD'
        ? emptyResponse('application/json; charset=utf-8')
        : jsonResponse(buildAiManifestJson());
    }

    if (path === '/api/ai/tools.yaml' && isReadMethod(request.method)) {
      return request.method === 'HEAD'
        ? emptyResponse('application/yaml; charset=utf-8')
        : textResponse(buildAiToolsYaml(), 'application/yaml; charset=utf-8');
    }

    if (path === '/openapi.json' && isReadMethod(request.method)) {
      return request.method === 'HEAD'
        ? emptyResponse('application/json; charset=utf-8')
        : jsonResponse(buildOpenApiDocument());
    }

    if (path === '/sitemap.xml' && isReadMethod(request.method)) {
      return request.method === 'HEAD'
        ? emptyResponse('application/xml; charset=utf-8')
        : textResponse(buildSitemapXml(), 'application/xml; charset=utf-8');
    }

    if (path === '/robots.txt' && isReadMethod(request.method)) {
      return request.method === 'HEAD'
        ? emptyResponse('text/plain; charset=utf-8')
        : textResponse(buildRobotsText(), 'text/plain; charset=utf-8');
    }

    const schemaMatch = path.match(/^\/api\/tools\/([^/]+)\/([^/]+)\/schema\.(yaml|json)$/);
    if (schemaMatch && isReadMethod(request.method)) {
      const [, category, slug, format] = schemaMatch;
      const tool = findAiTool(category, slug);
      if (!tool) {
        return notFound();
      }

      if (format === 'json') {
        return request.method === 'HEAD'
          ? emptyResponse('application/json; charset=utf-8')
          : jsonResponse(buildToolSchemaDocument(tool));
      }

      return request.method === 'HEAD'
        ? emptyResponse('application/yaml; charset=utf-8')
        : textResponse(buildToolSchemaYaml(tool), 'application/yaml; charset=utf-8');
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