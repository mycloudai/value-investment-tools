import { expect, test } from '@playwright/test';
import { toolCatalog } from '../src/lib/toolkit';

const standardTools = toolCatalog.filter((tool) => tool.renderMode !== 'journal' && tool.renderMode !== 'portfolio');

for (const tool of standardTools) {
  test(`${tool.name} 默认渲染正常`, async ({ page }) => {
    await page.goto(tool.route);

    await expect(page.getByTestId(`tool-page-${tool.slug}`)).toBeVisible();
    await expect(page.getByRole('heading', { name: tool.name })).toBeVisible();
    await expect(page.getByTestId('summary-metric-0')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('NaN');
    await expect(page.locator('body')).not.toContainText('Infinity');
  });
}

test('two-stage dcf responds to input changes', async ({ page }) => {
  await page.goto('/valuation/dcf-two-stage');

  const primaryMetric = page.getByTestId('summary-metric-0');
  const before = await primaryMetric.textContent();

  await page.getByTestId('input-growthRate').fill('14');

  await expect(primaryMetric).not.toHaveText(before ?? '');
  await expect(page.locator('body')).not.toContainText('NaN');
});

test('f-score updates when profitability weakens', async ({ page }) => {
  await page.goto('/health/f-score');

  const scoreCard = page.getByTestId('summary-metric-0');
  const before = await scoreCard.textContent();

  await page.getByTestId('input-roaCurrent').fill('-2');

  await expect(scoreCard).not.toHaveText(before ?? '');
});