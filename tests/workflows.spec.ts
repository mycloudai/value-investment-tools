import { expect, test } from '@playwright/test';

const fmpFixtures = {
  quote: [{ price: 150, marketCap: 300000000000, sharesOutstanding: 2000000000 }],
  'cash-flow-statement': [
    {
      freeCashFlow: 500000000,
      operatingCashFlow: 700000000,
      capitalExpenditure: -200000000,
      depreciationAndAmortization: 120000000,
      changeInWorkingCapital: 50000000,
    },
  ],
  'balance-sheet-statement': [
    {
      cashAndShortTermInvestments: 8000000000,
      totalDebt: 2000000000,
      totalAssets: 25000000000,
      totalLiabilities: 12000000000,
      totalCurrentAssets: 7000000000,
      totalCurrentLiabilities: 3000000000,
      retainedEarnings: 6000000000,
    },
    {
      totalDebt: 2500000000,
      totalAssets: 24000000000,
    },
  ],
  'income-statement': [
    {
      revenue: 10000000000,
      netIncome: 900000000,
      ebit: 1200000000,
      weightedAverageShsOutDil: 2000000000,
    },
    {
      weightedAverageShsOutDil: 2050000000,
    },
  ],
  ratios: [
    {
      returnOnAssets: 0.08,
      grossProfitMargin: 0.45,
      assetTurnover: 1.3,
      currentRatio: 2,
    },
    {
      returnOnAssets: 0.06,
      grossProfitMargin: 0.42,
      assetTurnover: 1.2,
      currentRatio: 1.8,
    },
  ],
  'key-metrics': [{ roic: 0.14 }],
} as const;

test('journal supports create export and delete', async ({ page }) => {
  await page.goto('/journal/thesis');

  await page.getByPlaceholder('代码，例如 AAPL').fill('AAPL');
  await page.getByPlaceholder('买入价').fill('123');
  await page.getByPlaceholder('核心论点').fill('品牌与生态带来持续回购和稳定现金流。');
  await page.getByPlaceholder('关键假设').fill('硬件升级节奏维持。');
  await page.getByPlaceholder('主要风险').fill('新品周期走弱。');
  await page.getByPlaceholder('卖出条件').fill('估值明显透支长期回报。');
  await page.getByPlaceholder('复盘记录').fill('等待下一次财报验证。');
  await page.getByRole('button', { name: '保存条目' }).click();

  await expect(page.getByTestId('journal-table')).toContainText('AAPL');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('mycloudai-investment-thesis.csv');

  await page.getByRole('button', { name: '删除' }).click();
  await expect(page.getByTestId('journal-table')).not.toContainText('AAPL');
});

test('portfolio tracker calculates pnl and margin of safety', async ({ page }) => {
  await page.goto('/journal/portfolio');

  await page.getByPlaceholder('代码，例如 NVDA').fill('NVDA');
  await page.getByPlaceholder('股数').fill('10');
  await page.getByPlaceholder('买入价').fill('100');
  await page.getByPlaceholder('当前价').fill('120');
  await page.getByPlaceholder('最新内在价值估算').fill('150');
  await page.getByRole('button', { name: '保存持仓' }).click();

  await expect(page.getByTestId('portfolio-table')).toContainText('NVDA');
  await expect(page.getByTestId('portfolio-table')).toContainText('20.0%');

  await page.getByRole('button', { name: '删除' }).click();
  await expect(page.getByTestId('portfolio-table')).not.toContainText('NVDA');
});

test('data center validates api key and can export snapshot', async ({ page }) => {
  await page.goto('/data');

  await page.getByTestId('fmp-bundle-fetch').click();
  await expect(page.getByText('请先填写 FMP API Key。')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('mycloudai-investment-snapshot.json');
});

test('data center can map fmp research bundle into tool inputs', async ({ page }) => {
  await page.route('https://financialmodelingprep.com/api/v3/**', async (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.split('/')[3] as keyof typeof fmpFixtures;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fmpFixtures[endpoint] ?? []),
    });
  });

  await page.goto('/data');

  await page.getByPlaceholder('输入 FMP API Key').fill('demo');
  await page.getByPlaceholder('Ticker，例如 AAPL').fill('MSFT');
  await page.getByTestId('fmp-bundle-fetch').click();

  await expect(page.getByTestId('fmp-suggestion-dcf-two-stage')).toBeVisible();
  await page.getByTestId('fmp-suggestion-dcf-two-stage').getByRole('button', { name: '应用到工具' }).click();
  await page.getByTestId('fmp-suggestion-dcf-two-stage').getByRole('link', { name: '打开工具' }).click();

  await expect(page).toHaveURL('/valuation/dcf-two-stage');
  await expect(page.getByTestId('input-baseFcf')).toHaveValue('500');
  await expect(page.getByTestId('input-netCash')).toHaveValue('6000');
  await expect(page.getByTestId('input-sharesOutstanding')).toHaveValue('2000');
  await expect(page.getByTestId('input-currentPrice')).toHaveValue('150');
});