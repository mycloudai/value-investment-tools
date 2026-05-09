import { expect, test } from '@playwright/test';

const currency = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number) => currency.format(value);

const formatPercent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

const discount = (value: number, rate: number, year: number) => value / (1 + rate) ** year;

const asNumber = async (promise: Promise<string>) => Number(await promise);

test('two-stage dcf summary matches manual calculation', async ({ page }) => {
  await page.goto('/valuation/dcf-two-stage');

  const baseFcf = await asNumber(page.getByTestId('input-baseFcf').inputValue());
  const growthRate = (await asNumber(page.getByTestId('input-growthRate').inputValue())) / 100;
  const years = await asNumber(page.getByTestId('input-years').inputValue());
  const terminalGrowthRate = (await asNumber(page.getByTestId('input-terminalGrowthRate').inputValue())) / 100;
  const wacc = (await asNumber(page.getByTestId('input-wacc').inputValue())) / 100;
  const netCash = await asNumber(page.getByTestId('input-netCash').inputValue());
  const shares = await asNumber(page.getByTestId('input-sharesOutstanding').inputValue());

  const cashFlows = Array.from({ length: years }, (_, index) => baseFcf * (1 + growthRate) ** (index + 1));
  const presentValues = cashFlows.map((cashFlow, index) => discount(cashFlow, wacc, index + 1));
  const terminalValue = (cashFlows[cashFlows.length - 1] * (1 + terminalGrowthRate)) / (wacc - terminalGrowthRate);
  const equityValue = presentValues.reduce((sum, value) => sum + value, 0) + discount(terminalValue, wacc, years) + netCash;
  const intrinsicValuePerShare = equityValue / shares;

  await expect(page.getByTestId('summary-metric-0')).toContainText(formatCurrency(intrinsicValuePerShare));
});

test('f-score summary matches manual scoring logic', async ({ page }) => {
  await page.goto('/health/f-score');

  await page.getByTestId('input-roaCurrent').fill('-2');

  const score = [
    Number(await page.getByTestId('input-roaCurrent').inputValue()) > 0,
    Number(await page.getByTestId('input-cfo').inputValue()) > 0,
    Number(await page.getByTestId('input-roaCurrent').inputValue()) > Number(await page.getByTestId('input-roaPrior').inputValue()),
    Number(await page.getByTestId('input-cfo').inputValue()) > Number(await page.getByTestId('input-netIncome').inputValue()),
    Number(await page.getByTestId('input-leverageCurrent').inputValue()) < Number(await page.getByTestId('input-leveragePrior').inputValue()),
    Number(await page.getByTestId('input-currentRatioCurrent').inputValue()) > Number(await page.getByTestId('input-currentRatioPrior').inputValue()),
    Number(await page.getByTestId('input-sharesCurrent').inputValue()) <= Number(await page.getByTestId('input-sharesPrior').inputValue()),
    Number(await page.getByTestId('input-grossMarginCurrent').inputValue()) > Number(await page.getByTestId('input-grossMarginPrior').inputValue()),
    Number(await page.getByTestId('input-assetTurnoverCurrent').inputValue()) > Number(await page.getByTestId('input-assetTurnoverPrior').inputValue()),
  ].filter(Boolean).length;

  await expect(page.getByTestId('summary-metric-0')).toContainText(`${score} / 9`);
});

test('kelly calculator summary matches formula', async ({ page }) => {
  await page.goto('/risk/kelly');

  const winRate = (await asNumber(page.getByTestId('input-winRate').inputValue())) / 100;
  const payoffRatio = await asNumber(page.getByTestId('input-payoffRatio').inputValue());
  const fullKelly = Math.max((winRate * payoffRatio - (1 - winRate)) / payoffRatio, 0);
  const halfKelly = fullKelly / 2;

  await expect(page.getByTestId('summary-metric-0')).toContainText(formatPercent(fullKelly));
  await expect(page.getByTestId('summary-metric-1')).toContainText(formatPercent(halfKelly));
});

test('margin of safety summary matches weighted valuation math', async ({ page }) => {
  await page.goto('/risk/margin-of-safety');

  const dcfValue = await asNumber(page.getByTestId('input-dcfValue').inputValue());
  const dcfWeight = await asNumber(page.getByTestId('input-dcfWeight').inputValue());
  const grahamValue = await asNumber(page.getByTestId('input-grahamValue').inputValue());
  const grahamWeight = await asNumber(page.getByTestId('input-grahamWeight').inputValue());
  const multiplesValue = await asNumber(page.getByTestId('input-multiplesValue').inputValue());
  const multiplesWeight = await asNumber(page.getByTestId('input-multiplesWeight').inputValue());
  const ddmValue = await asNumber(page.getByTestId('input-ddmValue').inputValue());
  const ddmWeight = await asNumber(page.getByTestId('input-ddmWeight').inputValue());
  const customValue = await asNumber(page.getByTestId('input-customValue').inputValue());
  const customWeight = await asNumber(page.getByTestId('input-customWeight').inputValue());
  const currentPrice = await asNumber(page.getByTestId('input-currentPrice').inputValue());

  const totalWeight = dcfWeight + grahamWeight + multiplesWeight + ddmWeight + customWeight;
  const weightedValue = (dcfValue * dcfWeight + grahamValue * grahamWeight + multiplesValue * multiplesWeight + ddmValue * ddmWeight + customValue * customWeight) / totalWeight;
  const margin = (weightedValue - currentPrice) / weightedValue;

  await expect(page.getByTestId('summary-metric-0')).toContainText(formatCurrency(weightedValue));
  await expect(page.getByTestId('summary-metric-1')).toContainText(formatPercent(margin));
});

test('compounder summary matches compounding loop', async ({ page }) => {
  await page.goto('/tools/compounder');

  const initialCapital = await asNumber(page.getByTestId('input-initialCapital').inputValue());
  const annualContribution = await asNumber(page.getByTestId('input-annualContribution').inputValue());
  const years = await asNumber(page.getByTestId('input-years').inputValue());
  const baseRate = (await asNumber(page.getByTestId('input-baseRate').inputValue())) / 100;

  let balance = initialCapital;
  for (let year = 0; year < years; year += 1) {
    balance = balance * (1 + baseRate) + annualContribution;
  }

  const contributions = initialCapital + annualContribution * years;
  const gains = balance - contributions;

  await expect(page.getByTestId('summary-metric-0')).toContainText(formatCurrency(balance));
  await expect(page.getByTestId('summary-metric-2')).toContainText(formatCurrency(gains));
});

test('altman z-score summary matches manual formula', async ({ page }) => {
  await page.goto('/health/z-score');

  const workingCapital = await asNumber(page.getByTestId('input-workingCapital').inputValue());
  const retainedEarnings = await asNumber(page.getByTestId('input-retainedEarnings').inputValue());
  const ebit = await asNumber(page.getByTestId('input-ebit').inputValue());
  const marketValueEquity = await asNumber(page.getByTestId('input-marketValueEquity').inputValue());
  const totalLiabilities = await asNumber(page.getByTestId('input-totalLiabilities').inputValue());
  const sales = await asNumber(page.getByTestId('input-sales').inputValue());
  const totalAssets = await asNumber(page.getByTestId('input-totalAssets').inputValue());

  const x1 = workingCapital / totalAssets;
  const x2 = retainedEarnings / totalAssets;
  const x3 = ebit / totalAssets;
  const x4 = marketValueEquity / totalLiabilities;
  const x5 = sales / totalAssets;
  const z = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + x5;
  const zone = z > 2.99 ? '安全区' : z >= 1.81 ? '灰色区' : '危险区';

  await expect(page.getByTestId('summary-metric-0')).toContainText(z.toFixed(2));
  await expect(page.getByTestId('summary-metric-1')).toContainText(zone);
});

test('wacc summary matches weighted capital cost formula', async ({ page }) => {
  await page.goto('/tools/wacc');

  const equityValue = await asNumber(page.getByTestId('input-equityValue').inputValue());
  const debtValue = await asNumber(page.getByTestId('input-debtValue').inputValue());
  const taxRate = (await asNumber(page.getByTestId('input-taxRate').inputValue())) / 100;
  const riskFreeRate = (await asNumber(page.getByTestId('input-riskFreeRate').inputValue())) / 100;
  const beta = await asNumber(page.getByTestId('input-beta').inputValue());
  const equityRiskPremium = (await asNumber(page.getByTestId('input-equityRiskPremium').inputValue())) / 100;
  const interestExpense = await asNumber(page.getByTestId('input-interestExpense').inputValue());
  const averageDebt = await asNumber(page.getByTestId('input-averageDebt').inputValue());

  const totalCapital = equityValue + debtValue;
  const costOfEquity = riskFreeRate + beta * equityRiskPremium;
  const costOfDebt = interestExpense / averageDebt;
  const wacc = (equityValue / totalCapital) * costOfEquity + (debtValue / totalCapital) * costOfDebt * (1 - taxRate);

  await expect(page.getByTestId('summary-metric-0')).toContainText(formatPercent(wacc));
  await expect(page.getByTestId('summary-metric-1')).toContainText(formatPercent(costOfEquity));
});