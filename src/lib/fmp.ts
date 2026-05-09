import { toolCatalog } from './toolkit';

export type FmpEndpointKey =
  | 'quote'
  | 'cash-flow-statement'
  | 'balance-sheet-statement'
  | 'income-statement'
  | 'ratios'
  | 'key-metrics';

export interface FmpResearchHighlight {
  label: string;
  value: string;
  note?: string;
}

export interface FmpToolSuggestion {
  toolId: string;
  toolName: string;
  route: string;
  rationale: string;
  coverage: string[];
  values: Record<string, number | string>;
}

export interface FmpResearchSnapshot {
  ticker: string;
  availableEndpoints: FmpEndpointKey[];
  missingEndpoints: FmpEndpointKey[];
  highlights: FmpResearchHighlight[];
  suggestions: FmpToolSuggestion[];
}

export const fmpEndpointOptions: Array<{ label: string; value: FmpEndpointKey }> = [
  { label: 'Quote', value: 'quote' },
  { label: 'Cash Flow Statement', value: 'cash-flow-statement' },
  { label: 'Balance Sheet Statement', value: 'balance-sheet-statement' },
  { label: 'Income Statement', value: 'income-statement' },
  { label: 'Ratios', value: 'ratios' },
  { label: 'Key Metrics', value: 'key-metrics' },
];

export const fmpResearchEndpoints = fmpEndpointOptions.map((option) => option.value);

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const compactObject = <T extends Record<string, number | string | undefined>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Record<string, number | string>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const asRecord = (value: unknown) => (isRecord(value) ? value : {});

const firstRecord = (payload: unknown) => (Array.isArray(payload) ? asRecord(payload[0]) : {});

const secondRecord = (payload: unknown) => (Array.isArray(payload) ? asRecord(payload[1]) : {});

const readNumber = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }

    const parsed = Number(String(raw ?? '').trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const toMillions = (value: number | undefined) => (value === undefined ? undefined : Number((value / 1_000_000).toFixed(2)));

const toPercentPoint = (value: number | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return Number(normalized.toFixed(2));
};

const formatMillions = (value: number | undefined) => (value === undefined ? '缺失' : `${currencyFormatter.format(value * 1_000_000)}（约 ${value.toFixed(2)}m）`);

const formatPrice = (value: number | undefined) => (value === undefined ? '缺失' : currencyFormatter.format(value));

const formatPercentPoint = (value: number | undefined) => (value === undefined ? '缺失' : percentFormatter.format(value / 100));

const buildSuggestion = (
  toolId: string,
  rationale: string,
  values: Record<string, number | string | undefined>,
  requiredKeys: string[],
) => {
  const tool = toolCatalog.find((entry) => entry.id === toolId);
  if (!tool) {
    return null;
  }

  const compactValues = compactObject(values);
  if (!requiredKeys.every((key) => key in compactValues)) {
    return null;
  }

  return {
    toolId,
    toolName: tool.name,
    route: tool.route,
    rationale,
    coverage: Object.keys(compactValues),
    values: compactValues,
  } satisfies FmpToolSuggestion;
};

export const deriveFmpResearchSnapshot = (ticker: string, payloads: Record<string, unknown>): FmpResearchSnapshot => {
  const availableEndpoints = fmpResearchEndpoints.filter((endpoint) => endpoint in payloads && payloads[endpoint] !== undefined);
  const missingEndpoints = fmpResearchEndpoints.filter((endpoint) => !availableEndpoints.includes(endpoint));

  const quote = firstRecord(payloads.quote);
  const cashFlowCurrent = firstRecord(payloads['cash-flow-statement']);
  const balanceCurrent = firstRecord(payloads['balance-sheet-statement']);
  const balancePrior = secondRecord(payloads['balance-sheet-statement']);
  const incomeCurrent = firstRecord(payloads['income-statement']);
  const incomePrior = secondRecord(payloads['income-statement']);
  const ratiosCurrent = firstRecord(payloads.ratios);
  const ratiosPrior = secondRecord(payloads.ratios);
  const keyMetricsCurrent = firstRecord(payloads['key-metrics']);

  const currentPrice = readNumber(quote, ['price']);
  const marketCap = toMillions(readNumber(quote, ['marketCap']));
  const sharesOutstanding = toMillions(readNumber(quote, ['sharesOutstanding']));
  const freeCashFlow = toMillions(readNumber(cashFlowCurrent, ['freeCashFlow']));
  const operatingCashFlow = toMillions(readNumber(cashFlowCurrent, ['operatingCashFlow', 'netCashProvidedByOperatingActivities']));
  const capitalExpenditureRaw = readNumber(cashFlowCurrent, ['capitalExpenditure']);
  const capitalExpenditure = capitalExpenditureRaw === undefined ? undefined : toMillions(Math.abs(capitalExpenditureRaw));
  const depreciation = toMillions(readNumber(cashFlowCurrent, ['depreciationAndAmortization', 'depreciationAndAmortizationExpense']));
  const workingCapitalChange = toMillions(readNumber(cashFlowCurrent, ['changeInWorkingCapital']));
  const cash = toMillions(readNumber(balanceCurrent, ['cashAndShortTermInvestments', 'cashAndCashEquivalents', 'cashAndCashEquivalentsAtCarryingValue']));
  const totalDebt = toMillions(readNumber(balanceCurrent, ['totalDebt']));
  const netCash = cash !== undefined && totalDebt !== undefined ? Number((cash - totalDebt).toFixed(2)) : undefined;
  const totalAssets = toMillions(readNumber(balanceCurrent, ['totalAssets']));
  const totalAssetsPrior = toMillions(readNumber(balancePrior, ['totalAssets']));
  const totalLiabilities = toMillions(readNumber(balanceCurrent, ['totalLiabilities']));
  const totalCurrentAssets = toMillions(readNumber(balanceCurrent, ['totalCurrentAssets']));
  const totalCurrentLiabilities = toMillions(readNumber(balanceCurrent, ['totalCurrentLiabilities']));
  const retainedEarnings = toMillions(readNumber(balanceCurrent, ['retainedEarnings']));
  const revenue = toMillions(readNumber(incomeCurrent, ['revenue']));
  const netIncome = toMillions(readNumber(incomeCurrent, ['netIncome']));
  const ebit = toMillions(readNumber(incomeCurrent, ['ebit']));
  const sharesCurrent = toMillions(readNumber(incomeCurrent, ['weightedAverageShsOutDil', 'weightedAverageShsOut']));
  const sharesPrior = toMillions(readNumber(incomePrior, ['weightedAverageShsOutDil', 'weightedAverageShsOut']));
  const roaCurrent = toPercentPoint(readNumber(ratiosCurrent, ['returnOnAssets', 'roa']));
  const roaPrior = toPercentPoint(readNumber(ratiosPrior, ['returnOnAssets', 'roa']));
  const grossMarginCurrent = toPercentPoint(readNumber(ratiosCurrent, ['grossProfitMargin']));
  const grossMarginPrior = toPercentPoint(readNumber(ratiosPrior, ['grossProfitMargin']));
  const assetTurnoverCurrent = readNumber(ratiosCurrent, ['assetTurnover']);
  const assetTurnoverPrior = readNumber(ratiosPrior, ['assetTurnover']);
  const currentRatioCurrent = readNumber(ratiosCurrent, ['currentRatio']);
  const currentRatioPrior = readNumber(ratiosPrior, ['currentRatio']);
  const roic = toPercentPoint(readNumber(keyMetricsCurrent, ['roic']));
  const leverageCurrent = totalDebt !== undefined && totalAssets !== undefined && totalAssets !== 0 ? Number((totalDebt / totalAssets).toFixed(4)) : undefined;
  const totalDebtPrior = toMillions(readNumber(balancePrior, ['totalDebt']));
  const leveragePrior = totalDebtPrior !== undefined && totalAssetsPrior !== undefined && totalAssetsPrior !== 0 ? Number((totalDebtPrior / totalAssetsPrior).toFixed(4)) : undefined;
  const workingCapital =
    totalCurrentAssets !== undefined && totalCurrentLiabilities !== undefined ? Number((totalCurrentAssets - totalCurrentLiabilities).toFixed(2)) : undefined;

  const highlights: FmpResearchHighlight[] = [
    { label: '当前股价', value: formatPrice(currentPrice) },
    { label: '自由现金流', value: formatMillions(freeCashFlow) },
    { label: '净现金', value: formatMillions(netCash), note: '按现金减总债务粗算' },
    { label: 'ROA', value: formatPercentPoint(roaCurrent) },
    { label: '毛利率', value: formatPercentPoint(grossMarginCurrent) },
    { label: 'ROIC', value: formatPercentPoint(roic) },
    { label: '市值', value: formatMillions(marketCap) },
  ];

  const suggestions = [
    buildSuggestion(
      'dcf-two-stage',
      '把 FMP 的价格、FCF、净现金和股数直接映射到 DCF 参数。',
      {
        baseFcf: freeCashFlow,
        netCash,
        sharesOutstanding,
        currentPrice,
      },
      ['baseFcf', 'sharesOutstanding', 'currentPrice'],
    ),
    buildSuggestion(
      'dcf-reverse',
      '用市场价格与基础面快照反推隐含增长率。',
      {
        baseFcf: freeCashFlow,
        netCash,
        sharesOutstanding,
        currentPrice,
      },
      ['baseFcf', 'sharesOutstanding', 'currentPrice'],
    ),
    buildSuggestion(
      'owner-earnings',
      '现金流量表与利润表可直接预填 Owner Earnings。',
      {
        netIncome,
        depreciation,
        totalCapex: capitalExpenditure,
        workingCapitalChange,
        sharesOutstanding,
        currentPrice,
      },
      ['netIncome', 'totalCapex', 'sharesOutstanding', 'currentPrice'],
    ),
    buildSuggestion(
      'f-score',
      '用连续两年的 ROA、杠杆、流动性和毛利率自动补齐 F-Score。',
      {
        roaCurrent,
        roaPrior,
        cfo: operatingCashFlow,
        netIncome,
        leverageCurrent,
        leveragePrior,
        currentRatioCurrent,
        currentRatioPrior,
        sharesCurrent: sharesCurrent ?? sharesOutstanding,
        sharesPrior,
        grossMarginCurrent,
        grossMarginPrior,
        assetTurnoverCurrent,
        assetTurnoverPrior,
      },
      ['roaCurrent', 'roaPrior', 'cfo', 'netIncome', 'currentRatioCurrent', 'currentRatioPrior'],
    ),
    buildSuggestion(
      'z-score',
      '把资产负债表、利润表和市值拼成破产风险预警输入。',
      {
        workingCapital,
        retainedEarnings,
        ebit,
        marketValueEquity: marketCap,
        totalLiabilities,
        sales: revenue,
        totalAssets,
      },
      ['workingCapital', 'retainedEarnings', 'ebit', 'marketValueEquity', 'totalLiabilities', 'sales', 'totalAssets'],
    ),
    buildSuggestion(
      'fcf-quality',
      '快速检查利润、经营现金流和资本开支是否匹配。',
      {
        netIncome,
        operatingCashFlow,
        capitalExpenditure,
        totalAssets,
      },
      ['netIncome', 'operatingCashFlow', 'capitalExpenditure', 'totalAssets'],
    ),
  ].filter((entry): entry is FmpToolSuggestion => Boolean(entry));

  return {
    ticker: ticker.toUpperCase(),
    availableEndpoints,
    missingEndpoints,
    highlights,
    suggestions,
  };
};