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

test('two-stage dcf lets users switch display currency and shows unit reminder', async ({ page }) => {
  await page.goto('/valuation/dcf-two-stage');

  await expect(page.locator('#tool-inputs')).toContainText('总股数按亿股输入');
  await page.getByTestId('sidebar-section-currency-toggle').click();

  await expect(page.getByTestId('summary-metric-0')).toContainText('US$');

  await page.getByTestId('currency-option-HKD').click();

  await expect(page.locator('#tool-inputs')).toContainText('港币');
  await expect(page.getByTestId('summary-metric-0')).toContainText('HK$');
});

test('tool page sidebar sections are collapsed by default and can expand', async ({ page }) => {
  await page.goto('/valuation/dcf-two-stage');

  await expect(page.getByTestId('sidebar-section-navigation-content')).toHaveCount(0);
  await expect(page.getByTestId('sidebar-section-summary-content')).toHaveCount(0);

  await page.getByTestId('sidebar-section-navigation-toggle').click();
  await expect(page.getByTestId('sidebar-section-navigation-content')).toBeVisible();

  await page.getByTestId('sidebar-section-summary-toggle').click();
  await expect(page.getByTestId('sidebar-section-summary-content')).toBeVisible();
});

test('three-stage dcf supports custom stage durations', async ({ page }) => {
  await page.goto('/valuation/dcf-three-stage');

  const primaryMetric = page.getByTestId('summary-metric-0');
  const before = await primaryMetric.textContent();

  await page.getByTestId('input-stageOneYears').fill('3');
  await page.getByTestId('input-stageTwoYears').fill('4');

  await expect(primaryMetric).not.toHaveText(before ?? '');
  await expect(page.locator('#tool-details')).toContainText('3 年高增长 + 4 年过渡');
});

test('monte carlo dcf uses configurable projection years', async ({ page }) => {
  await page.goto('/valuation/dcf-monte-carlo');

  await page.getByTestId('input-projectionYears').fill('7');

  await expect(page.locator('#tool-details')).toContainText('显性预测期');
  await expect(page.locator('#tool-details')).toContainText('7 年');
});

test('f-score updates when profitability weakens', async ({ page }) => {
  await page.goto('/health/f-score');

  const scoreCard = page.getByTestId('summary-metric-0');
  const before = await scoreCard.textContent();

  await page.getByTestId('input-roaCurrent').fill('-2');

  await expect(scoreCard).not.toHaveText(before ?? '');
});