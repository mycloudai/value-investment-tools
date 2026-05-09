import { expect, test } from '@playwright/test';

test('dashboard hero can navigate to two-stage dcf', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('dashboard-hero')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MyCloudAI 价值投资工具' })).toBeVisible();

  await page.getByRole('link', { name: '进入两阶段 DCF' }).click();
  await expect(page).toHaveURL(/\/valuation\/dcf-two-stage$/);
  await expect(page.getByRole('heading', { name: '两阶段 DCF 计算器' })).toBeVisible();
});

test('top tabs land on category overview instead of a default tool', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: '估值工具' }).click();

  await expect(page).toHaveURL(/\/valuation$/);
  await expect(page.getByTestId('category-page-valuation')).toBeVisible();
  await expect(page.getByText('先选分类，再选工具')).toBeVisible();
});

test('dashboard search narrows category cards', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('例如：DCF、F-Score、复利、敏感度').fill('Kelly');

  await expect(page.getByTestId('tool-card-kelly')).toBeVisible();
  await expect(page.getByTestId('tool-card-rule-of-40')).toHaveCount(0);
});

test('dashboard search also matches tool purpose and scenario', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('例如：DCF、F-Score、复利、敏感度').fill('破产风险');

  await expect(page.getByTestId('tool-card-z-score')).toBeVisible();
  await expect(page.getByTestId('tool-card-kelly')).toHaveCount(0);
});