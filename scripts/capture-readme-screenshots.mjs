import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = new URL('../docs/screenshots/', import.meta.url);

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
};

const pathFor = (filename) => fileURLToPath(new URL(`../docs/screenshots/${filename}`, import.meta.url));

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1280 }, deviceScaleFactor: 2 });

await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
await page.screenshot({ path: pathFor('dashboard-overview.png'), fullPage: true });

await page.goto(`${baseUrl}/valuation`, { waitUntil: 'networkidle' });
await page.screenshot({ path: pathFor('valuation-category.png'), fullPage: true });

await page.goto(`${baseUrl}/valuation/dcf-two-stage`, { waitUntil: 'networkidle' });
await page.locator('#tool-results').scrollIntoViewIfNeeded();
await page.locator('#tool-results').screenshot({ path: pathFor('dcf-results.png') });

await page.route('https://financialmodelingprep.com/api/v3/**', async (route) => {
  const url = new URL(route.request().url());
  const endpoint = url.pathname.split('/')[3];
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(fmpFixtures[endpoint] ?? []),
  });
});

await page.goto(`${baseUrl}/data`, { waitUntil: 'networkidle' });
await page.getByPlaceholder('输入 FMP API Key').fill('demo');
await page.getByPlaceholder('Ticker，例如 AAPL').fill('MSFT');
await page.getByTestId('fmp-bundle-fetch').click();
await page.getByTestId('fmp-suggestion-dcf-two-stage').waitFor();
await page.getByTestId('fmp-research-panel').screenshot({ path: pathFor('data-research-bundle.png') });

await browser.close();