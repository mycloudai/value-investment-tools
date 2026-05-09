import { expect, test } from '@playwright/test';

test('api discovery exposes manifest, schema and sitemap', async ({ request }) => {
  const manifestResponse = await request.get('/api/ai/manifest.json');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();

  expect(manifest.domain).toBe('https://value-investment-tools.mycloudai.org');
  expect(manifest.discovery.toolsYaml).toContain('/api/ai/tools.yaml');

  const toolsResponse = await request.get('/api/ai/tools.yaml');
  expect(toolsResponse.ok()).toBeTruthy();
  const toolsYaml = await toolsResponse.text();
  expect(toolsYaml).toContain('dcf-two-stage');
  expect(toolsYaml).toContain('computeYaml');

  const schemaResponse = await request.get('/api/tools/valuation/dcf-two-stage/schema.yaml');
  expect(schemaResponse.ok()).toBeTruthy();
  const schemaYaml = await schemaResponse.text();
  expect(schemaYaml).toContain('fieldSchema:');
  expect(schemaYaml).toContain('baseFcf');
  expect(schemaYaml).toContain('https://value-investment-tools.mycloudai.org/api/tools/valuation/dcf-two-stage/schema.yaml');

  const sitemapResponse = await request.get('/sitemap.xml');
  expect(sitemapResponse.ok()).toBeTruthy();
  const sitemapXml = await sitemapResponse.text();
  expect(sitemapXml).toContain('<loc>https://value-investment-tools.mycloudai.org/valuation/dcf-two-stage</loc>');
});

test('yaml compute api returns expected kelly result', async ({ request }) => {
  const response = await request.post('/api/tools/risk/kelly/compute.yaml', {
    headers: {
      'content-type': 'application/yaml',
    },
    data: ['inputs:', '  winRate: 60', '  payoffRatio: 2'].join('\n'),
  });

  expect(response.ok()).toBeTruthy();
  const resultYaml = await response.text();
  expect(resultYaml).toContain('kind: mycloudai.value-investment.tool-result');
  expect(resultYaml).toContain('Full Kelly');
  expect(resultYaml).toContain('40.0%');
  expect(resultYaml).toContain('20.0%');
});

test('tool page hides yaml ui from normal users while api remains available', async ({ page, request }) => {
  await page.goto('/risk/kelly');

  await expect(page.getByTestId('tool-input-yaml')).toHaveCount(0);
  await expect(page.getByText('AI / YAML')).toHaveCount(0);
  await expect(page.getByTestId('summary-metric-0')).toContainText('Full Kelly');

  const response = await request.post('/api/tools/risk/kelly/compute.yaml', {
    headers: {
      'content-type': 'application/yaml',
    },
    data: ['inputs:', '  winRate: 60', '  payoffRatio: 2'].join('\n'),
  });
  const resultYaml = await response.text();

  expect(response.ok()).toBeTruthy();
  expect(resultYaml).toContain('40.0%');
});