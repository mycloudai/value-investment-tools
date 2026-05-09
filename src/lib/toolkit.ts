export type ToolCategory = 'valuation' | 'health' | 'growth' | 'risk' | 'journal' | 'tools';

export interface InputField {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'select' | 'series' | 'textarea';
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  sensitivity?: boolean;
  placeholder?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
}

export interface FormulaVariable {
  symbol: string;
  meaning: string;
  guidance: string;
}

export interface SummaryMetric {
  label: string;
  value: string;
  note?: string;
  tone?: 'positive' | 'negative' | 'neutral';
}

export interface DetailItem {
  label: string;
  value: string;
  hint?: string;
}

export type ChartSpec =
  | {
      type: 'line';
      title: string;
      data: Array<Record<string, string | number>>;
      xKey: string;
      lines: Array<{
        key: string;
        label: string;
        color: string;
      }>;
    }
  | {
      type: 'bar' | 'histogram';
      title: string;
      data: Array<Record<string, string | number>>;
      xKey: string;
      bars: Array<{
        key: string;
        label: string;
        color: string;
      }>;
    }
  | {
      type: 'pie';
      title: string;
      data: Array<{
        name: string;
        value: number;
        color: string;
      }>;
    }
  | {
      type: 'radar';
      title: string;
      data: Array<Record<string, string | number>>;
      angleKey: string;
      series: Array<{
        key: string;
        label: string;
        color: string;
      }>;
    }
  | {
      type: 'heatmap';
      title: string;
      rows: string[];
      columns: string[];
      cells: Array<{
        row: string;
        column: string;
        value: number;
      }>;
      highlight?: {
        row: string;
        column: string;
      };
    };

export interface ToolResult {
  summary: SummaryMetric[];
  details: DetailItem[];
  charts: ChartSpec[];
  narrative: string;
}

export interface ToolDefinition {
  id: string;
  slug: string;
  route: string;
  category: ToolCategory;
  name: string;
  shortName: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  tagline: string;
  purpose: string;
  scenario: string;
  formula: string;
  variables: FormulaVariable[];
  limitations: string[];
  fields: InputField[];
  sensitivityKeys: string[];
  compute?: (values: Record<string, number | string>) => ToolResult;
  renderMode?: 'standard' | 'journal' | 'portfolio';
}

export interface CategoryMeta {
  label: string;
  description: string;
  summary: string;
  surfaceClass: string;
}

const chartColors = ['#0066cc', '#2d8cff', '#7bb8ff', '#113b6d', '#62b1ff'];

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
});

const asNumber = (values: Record<string, number | string>, key: string) => {
  const value = values[key];
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const asText = (values: Record<string, number | string>, key: string) => String(values[key] ?? '').trim();

const asRate = (values: Record<string, number | string>, key: string) => asNumber(values, key) / 100;

const parseSeries = (input: number | string) =>
  String(input ?? '')
    .split(/[，,\n\s]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

const asSeries = (values: Record<string, number | string>, key: string) => parseSeries(values[key]);

const asPercentSeries = (values: Record<string, number | string>, key: string) => asSeries(values, key).map((item) => item / 100);

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const average = (values: number[]) => (values.length ? sum(values) / values.length : 0);

const median = (values: number[]) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const standardDeviation = (values: number[]) => {
  if (values.length < 2) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const cagr = (start: number, end: number, years: number) => {
  if (start <= 0 || end <= 0 || years <= 0) {
    return 0;
  }

  return (end / start) ** (1 / years) - 1;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const safeDivide = (numerator: number, denominator: number) => (denominator === 0 ? 0 : numerator / denominator);

const discount = (value: number, rate: number, year: number) => value / (1 + rate) ** year;

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatNumber = (value: number, digits = 2) =>
  Number.isFinite(value) ? Number(value).toFixed(digits) : '0.00';

const formatPercent = (value: number, digits = 1) => `${formatNumber(value * 100, digits)}%`;

const formatPercentPoint = (value: number, digits = 1) => `${formatNumber(value, digits)}%`;

const formatMultiple = (value: number, digits = 2) => `${formatNumber(value, digits)}x`;

const formatPlain = (value: number, digits = 2) => numberFormatter.format(Number(value.toFixed(digits)));

const sentiment = (value: number) => {
  if (value > 0.05) {
    return 'positive' as const;
  }

  if (value < -0.05) {
    return 'negative' as const;
  }

  return 'neutral' as const;
};

const gradeTone = (grade: string) => {
  if (grade === 'A' || grade === 'A+') {
    return 'positive' as const;
  }

  if (grade === 'D' || grade === 'F') {
    return 'negative' as const;
  }

  return 'neutral' as const;
};

const dcfModel = (
  baseFcf: number,
  yearlyGrowthRates: number[],
  discountRate: number,
  terminalGrowthRate: number,
  netCash: number,
  shares: number,
) => {
  const cashFlows = yearlyGrowthRates.map((growthRate, index) => {
    if (index === 0) {
      return baseFcf * (1 + growthRate);
    }

    return 0;
  });

  for (let index = 1; index < yearlyGrowthRates.length; index += 1) {
    cashFlows[index] = cashFlows[index - 1] * (1 + yearlyGrowthRates[index]);
  }

  const presentValues = cashFlows.map((cashFlow, index) => discount(cashFlow, discountRate, index + 1));
  const terminalCashFlow = cashFlows[cashFlows.length - 1] * (1 + terminalGrowthRate);
  const terminalValue = safeDivide(terminalCashFlow, discountRate - terminalGrowthRate);
  const presentTerminalValue = discount(terminalValue, discountRate, yearlyGrowthRates.length);
  const equityValue = sum(presentValues) + presentTerminalValue + netCash;
  const intrinsicValuePerShare = safeDivide(equityValue, shares);

  return {
    cashFlows,
    presentValues,
    terminalValue,
    presentTerminalValue,
    equityValue,
    intrinsicValuePerShare,
  };
};

const percentile = (values: number[], currentValue: number) => {
  if (!values.length) {
    return 0;
  }

  const count = values.filter((value) => value <= currentValue).length;
  return count / values.length;
};

const normalSample = (mean: number, sigma: number) => {
  const left = 1 - Math.random();
  const right = 1 - Math.random();
  const gaussian = Math.sqrt(-2 * Math.log(left)) * Math.cos(2 * Math.PI * right);
  return mean + sigma * gaussian;
};

const letterGrade = (score: number) => {
  if (score >= 85) {
    return 'A';
  }

  if (score >= 70) {
    return 'B';
  }

  if (score >= 55) {
    return 'C';
  }

  if (score >= 40) {
    return 'D';
  }

  return 'F';
};

const valueJudgement = (value: number) => {
  if (value <= 0.8) {
    return '显著低估';
  }

  if (value <= 0.95) {
    return '略低估';
  }

  if (value <= 1.1) {
    return '大致合理';
  }

  return '估值偏高';
};

const numberField = (
  key: string,
  label: string,
  defaultValue: number,
  description: string,
  extra: Partial<InputField> = {},
): InputField => ({
  key,
  label,
  defaultValue,
  description,
  type: 'number',
  step: 0.1,
  ...extra,
});

const selectField = (
  key: string,
  label: string,
  defaultValue: string,
  description: string,
  options: InputField['options'],
): InputField => ({
  key,
  label,
  defaultValue,
  description,
  type: 'select',
  options,
});

const seriesField = (
  key: string,
  label: string,
  defaultValue: string,
  description: string,
  extra: Partial<InputField> = {},
): InputField => ({
  key,
  label,
  defaultValue,
  description,
  type: 'series',
  placeholder: '用逗号输入序列，例如 12, 13, 15, 16, 18',
  ...extra,
});

const computeTwoStageDcf = (values: Record<string, number | string>): ToolResult => {
  const years = Math.round(asNumber(values, 'years'));
  const model = dcfModel(
    asNumber(values, 'baseFcf'),
    Array.from({ length: years }, () => asRate(values, 'growthRate')),
    asRate(values, 'wacc'),
    asRate(values, 'terminalGrowthRate'),
    asNumber(values, 'netCash'),
    asNumber(values, 'sharesOutstanding'),
  );
  const currentPrice = asNumber(values, 'currentPrice');
  const upside = safeDivide(model.intrinsicValuePerShare - currentPrice, currentPrice);
  const terminalWeight = safeDivide(model.presentTerminalValue, model.equityValue);

  return {
    summary: [
      {
        label: '合理股价',
        value: formatCurrency(model.intrinsicValuePerShare),
        note: '按默认 5 年高增长 + 永续增长计算',
      },
      {
        label: '相对当前价空间',
        value: formatPercent(upside),
        tone: sentiment(upside),
      },
      {
        label: '终值占比',
        value: formatPercent(terminalWeight),
        note: '越高代表对长期假设越敏感',
      },
    ],
    details: [
      {
        label: '权益价值',
        value: formatCurrency(model.equityValue),
        hint: '显性阶段现金流 + 终值现值 + 净现金',
      },
      {
        label: '显性阶段现值',
        value: formatCurrency(sum(model.presentValues)),
      },
      {
        label: '终值现值',
        value: formatCurrency(model.presentTerminalValue),
      },
      {
        label: '折现率 / 永续增长率',
        value: `${formatPercentPoint(asNumber(values, 'wacc'))} / ${formatPercentPoint(asNumber(values, 'terminalGrowthRate'))}`,
      },
    ],
    charts: [
      {
        type: 'line',
        title: '未来 FCF 与折现现值',
        xKey: 'year',
        data: model.cashFlows.map((cashFlow, index) => ({
          year: `Y${index + 1}`,
          fcf: Number(cashFlow.toFixed(2)),
          pv: Number(model.presentValues[index].toFixed(2)),
        })),
        lines: [
          { key: 'fcf', label: 'FCF', color: chartColors[0] },
          { key: 'pv', label: '现值', color: chartColors[3] },
        ],
      },
      {
        type: 'pie',
        title: '估值来源拆分',
        data: [
          { name: '显性阶段', value: sum(model.presentValues), color: chartColors[0] },
          { name: '终值', value: model.presentTerminalValue, color: chartColors[1] },
          { name: '净现金', value: asNumber(values, 'netCash'), color: chartColors[2] },
        ],
      },
    ],
    narrative:
      terminalWeight > 0.6
        ? '当前估值高度依赖终值，说明长期增长与折现率假设对结果影响很大。'
        : '估值更多由显性阶段现金流支撑，安全边际判断更偏向经营兑现能力。',
  };
};

const computeThreeStageDcf = (values: Record<string, number | string>): ToolResult => {
  const stageOneYears = 5;
  const stageTwoYears = 5;
  const growthOne = asRate(values, 'growthRateHigh');
  const growthTwo = asRate(values, 'growthRateTerminal');
  const fadeRates = Array.from({ length: stageTwoYears }, (_, index) => {
    const progress = (index + 1) / stageTwoYears;
    return growthOne + (growthTwo - growthOne) * progress;
  });
  const model = dcfModel(
    asNumber(values, 'baseFcf'),
    [...Array.from({ length: stageOneYears }, () => growthOne), ...fadeRates],
    asRate(values, 'wacc'),
    growthTwo,
    asNumber(values, 'netCash'),
    asNumber(values, 'sharesOutstanding'),
  );
  const currentPrice = asNumber(values, 'currentPrice');
  const upside = safeDivide(model.intrinsicValuePerShare - currentPrice, currentPrice);
  const stageOneValue = sum(model.presentValues.slice(0, stageOneYears));
  const stageTwoValue = sum(model.presentValues.slice(stageOneYears));

  return {
    summary: [
      { label: '三阶段合理股价', value: formatCurrency(model.intrinsicValuePerShare) },
      { label: '相对当前价空间', value: formatPercent(upside), tone: sentiment(upside) },
      {
        label: '阶段一占比',
        value: formatPercent(safeDivide(stageOneValue, model.equityValue)),
        note: '高增长阶段对估值的贡献',
      },
    ],
    details: [
      { label: '阶段一现值', value: formatCurrency(stageOneValue) },
      { label: '阶段二现值', value: formatCurrency(stageTwoValue) },
      { label: '终值现值', value: formatCurrency(model.presentTerminalValue) },
      { label: '衰减终点增长率', value: formatPercentPoint(asNumber(values, 'growthRateTerminal')) },
    ],
    charts: [
      {
        type: 'line',
        title: '三阶段 FCF 轨迹',
        xKey: 'year',
        data: model.cashFlows.map((cashFlow, index) => ({
          year: `Y${index + 1}`,
          fcf: Number(cashFlow.toFixed(2)),
          growth: Number((index < stageOneYears ? growthOne : fadeRates[index - stageOneYears]) * 100),
        })),
        lines: [
          { key: 'fcf', label: 'FCF', color: chartColors[0] },
          { key: 'growth', label: '增长率 %', color: chartColors[2] },
        ],
      },
      {
        type: 'bar',
        title: '阶段价值拆分',
        xKey: 'name',
        data: [
          { name: '阶段一', value: stageOneValue },
          { name: '阶段二', value: stageTwoValue },
          { name: '终值', value: model.presentTerminalValue },
        ],
        bars: [{ key: 'value', label: '价值', color: chartColors[0] }],
      },
    ],
    narrative: '三阶段模型更适合处理增长先快后慢的公司，能够减少直接把高增长永久化带来的偏差。',
  };
};

const computeReverseDcf = (values: Record<string, number | string>): ToolResult => {
  const currentPrice = asNumber(values, 'currentPrice');
  const shares = asNumber(values, 'sharesOutstanding');
  const targetEquityValue = currentPrice * shares;
  const terminalGrowth = asRate(values, 'terminalGrowthRate');
  const discountRate = asRate(values, 'wacc');
  const years = Math.round(asNumber(values, 'years'));
  const baseFcf = asNumber(values, 'baseFcf');
  const netCash = asNumber(values, 'netCash');

  let low = -0.2;
  let high = 0.35;

  for (let index = 0; index < 80; index += 1) {
    const middle = (low + high) / 2;
    const model = dcfModel(baseFcf, Array.from({ length: years }, () => middle), discountRate, terminalGrowth, netCash, shares);
    if (model.equityValue > targetEquityValue) {
      high = middle;
    } else {
      low = middle;
    }
  }

  const impliedGrowth = (low + high) / 2;
  const expectedGrowth = asRate(values, 'expectedGrowthRate');
  const gap = impliedGrowth - expectedGrowth;
  const judgement = gap > 0.03 ? '市场偏乐观' : gap < -0.03 ? '市场偏保守' : '市场预期接近你的假设';

  return {
    summary: [
      {
        label: '隐含增长率',
        value: formatPercent(impliedGrowth),
        note: '使 DCF 等于当前价格所需的 5 年增长率',
      },
      {
        label: '与自有预期偏差',
        value: formatPercent(gap),
        tone: sentiment(-gap),
      },
      {
        label: '市场判断',
        value: judgement,
        tone: gap > 0.03 ? 'negative' : 'positive',
      },
    ],
    details: [
      { label: '当前股价', value: formatCurrency(currentPrice) },
      { label: '目标权益价值', value: formatCurrency(targetEquityValue) },
      { label: '你的增长假设', value: formatPercent(expectedGrowth) },
      { label: '折现率 / 永续增长率', value: `${formatPercentPoint(asNumber(values, 'wacc'))} / ${formatPercentPoint(asNumber(values, 'terminalGrowthRate'))}` },
    ],
    charts: [
      {
        type: 'bar',
        title: '预期对比',
        xKey: 'name',
        data: [
          { name: '市场隐含', value: Number((impliedGrowth * 100).toFixed(2)) },
          { name: '你的假设', value: Number((expectedGrowth * 100).toFixed(2)) },
        ],
        bars: [{ key: 'value', label: '增长率 %', color: chartColors[0] }],
      },
    ],
    narrative: judgement,
  };
};

const computeMonteCarloDcf = (values: Record<string, number | string>): ToolResult => {
  const iterations = Math.round(asNumber(values, 'iterations'));
  const growthMean = asRate(values, 'growthMean');
  const growthStd = asRate(values, 'growthStd');
  const waccMean = asRate(values, 'waccMean');
  const waccStd = asRate(values, 'waccStd');
  const terminalGrowth = asRate(values, 'terminalGrowthRate');
  const shares = asNumber(values, 'sharesOutstanding');
  const netCash = asNumber(values, 'netCash');
  const currentPrice = asNumber(values, 'currentPrice');
  const results = Array.from({ length: iterations }, () => {
    const growth = clamp(normalSample(growthMean, growthStd), -0.25, 0.35);
    const wacc = clamp(normalSample(waccMean, waccStd), terminalGrowth + 0.03, 0.25);
    const model = dcfModel(asNumber(values, 'baseFcf'), Array.from({ length: 5 }, () => growth), wacc, terminalGrowth, netCash, shares);
    return model.intrinsicValuePerShare;
  }).sort((left, right) => left - right);

  const pick = (ratio: number) => results[Math.max(0, Math.min(results.length - 1, Math.floor(results.length * ratio)))];
  const p10 = pick(0.1);
  const p50 = pick(0.5);
  const p90 = pick(0.9);
  const aboveCurrentProbability = safeDivide(results.filter((value) => value > currentPrice).length, results.length);
  const minValue = results[0];
  const maxValue = results[results.length - 1];
  const bucketSize = safeDivide(maxValue - minValue, 12) || 1;
  const histogram = Array.from({ length: 12 }, (_, index) => {
    const lower = minValue + bucketSize * index;
    const upper = lower + bucketSize;
    const count = results.filter((value) => value >= lower && (index === 11 ? value <= upper : value < upper)).length;
    return {
      bucket: `${formatNumber(lower, 0)}-${formatNumber(upper, 0)}`,
      count,
    };
  });

  return {
    summary: [
      { label: 'P50 合理股价', value: formatCurrency(p50) },
      { label: 'P10 - P90 区间', value: `${formatCurrency(p10)} - ${formatCurrency(p90)}` },
      { label: '高于现价概率', value: formatPercent(aboveCurrentProbability), tone: sentiment(aboveCurrentProbability - 0.5) },
    ],
    details: [
      { label: '模拟次数', value: formatPlain(iterations, 0) },
      { label: '增长率均值 / 波动', value: `${formatPercentPoint(asNumber(values, 'growthMean'))} / ${formatPercentPoint(asNumber(values, 'growthStd'))}` },
      { label: 'WACC 均值 / 波动', value: `${formatPercentPoint(asNumber(values, 'waccMean'))} / ${formatPercentPoint(asNumber(values, 'waccStd'))}` },
      { label: '当前股价', value: formatCurrency(currentPrice) },
    ],
    charts: [
      {
        type: 'histogram',
        title: '价格分布直方图',
        xKey: 'bucket',
        data: histogram,
        bars: [{ key: 'count', label: '样本数', color: chartColors[0] }],
      },
    ],
    narrative:
      aboveCurrentProbability > 0.6
        ? '在当前假设分布下，超过现价的概率较高。'
        : '结果分布更分散，说明估值对增长率和折现率波动较敏感。',
  };
};

const computeGrahamOriginal = (values: Record<string, number | string>): ToolResult => {
  const eps = asNumber(values, 'eps');
  const bvps = asNumber(values, 'bvps');
  const currentPrice = asNumber(values, 'currentPrice');
  const intrinsicValue = Math.sqrt(Math.max(22.5 * eps * bvps, 0));
  const margin = safeDivide(intrinsicValue - currentPrice, intrinsicValue);

  return {
    summary: [
      { label: '内在价值', value: formatCurrency(intrinsicValue) },
      { label: '安全边际', value: formatPercent(margin), tone: sentiment(margin) },
      {
        label: 'Graham 33% 标准',
        value: margin >= 0.33 ? '达到标准' : '未达到标准',
        tone: margin >= 0.33 ? 'positive' : 'negative',
      },
    ],
    details: [
      { label: 'EPS', value: formatCurrency(eps) },
      { label: 'BVPS', value: formatCurrency(bvps) },
      { label: '当前股价', value: formatCurrency(currentPrice) },
    ],
    charts: [
      {
        type: 'bar',
        title: '股价对比',
        xKey: 'name',
        data: [
          { name: '当前股价', value: currentPrice },
          { name: '内在价值', value: intrinsicValue },
        ],
        bars: [{ key: 'value', label: '价格', color: chartColors[0] }],
      },
    ],
    narrative: '原始 Graham 公式适合盈利与账面价值都相对稳定的传统型企业，不适合轻资产成长股。',
  };
};

const computeGrahamRevised = (values: Record<string, number | string>): ToolResult => {
  const eps = asNumber(values, 'eps');
  const growth = asNumber(values, 'growthRate');
  const rf = Math.max(asNumber(values, 'aaaYield'), asNumber(values, 'treasuryYield'));
  const riskFactor = Number(asText(values, 'riskFactor')) || 1;
  const fairPe = (8.5 + 2 * growth) * safeDivide(4.4, rf) * riskFactor;
  const intrinsicValue = fairPe * eps;
  const currentPrice = asNumber(values, 'currentPrice');
  const margin = safeDivide(intrinsicValue - currentPrice, intrinsicValue);

  return {
    summary: [
      { label: '公允 PE', value: formatMultiple(fairPe) },
      { label: '风险修正内在价值', value: formatCurrency(intrinsicValue) },
      { label: '安全边际', value: formatPercent(margin), tone: sentiment(margin) },
    ],
    details: [
      { label: '利率基准 RF', value: formatPercentPoint(rf) },
      { label: '风险系数', value: formatPlain(riskFactor, 2) },
      { label: '当前股价', value: formatCurrency(currentPrice) },
    ],
    charts: [
      {
        type: 'bar',
        title: '估值拆解',
        xKey: 'name',
        data: [
          { name: '公允 PE', value: fairPe },
          { name: '当前 PE 隐含值', value: safeDivide(currentPrice, eps) },
        ],
        bars: [{ key: 'value', label: '倍数', color: chartColors[0] }],
      },
    ],
    narrative: '新版 Graham 把利率环境与行业稳定性纳入估值，更适合横跨不同宏观利率周期的比较。',
  };
};

const computeOwnerEarnings = (values: Record<string, number | string>): ToolResult => {
  const maintenanceCapex = asNumber(values, 'totalCapex') * asRate(values, 'maintenanceRatio');
  const ownerEarnings =
    asNumber(values, 'netIncome') +
    asNumber(values, 'depreciation') -
    maintenanceCapex -
    asNumber(values, 'workingCapitalChange');
  const perShare = safeDivide(ownerEarnings, asNumber(values, 'sharesOutstanding'));
  const priceToOe = safeDivide(asNumber(values, 'currentPrice'), perShare);

  return {
    summary: [
      { label: 'Owner Earnings', value: formatCurrency(ownerEarnings) },
      { label: '每股 OE', value: formatCurrency(perShare) },
      { label: 'Price / OE', value: formatMultiple(priceToOe) },
    ],
    details: [
      { label: '净利润', value: formatCurrency(asNumber(values, 'netIncome')) },
      { label: '折旧摊销', value: formatCurrency(asNumber(values, 'depreciation')) },
      { label: '维持性资本支出', value: formatCurrency(maintenanceCapex) },
      { label: '营运资本变化', value: formatCurrency(asNumber(values, 'workingCapitalChange')) },
    ],
    charts: [
      {
        type: 'bar',
        title: 'OE 组成',
        xKey: 'name',
        data: [
          { name: '净利润', value: asNumber(values, 'netIncome') },
          { name: '折旧摊销', value: asNumber(values, 'depreciation') },
          { name: '维持性 Capex', value: -maintenanceCapex },
          { name: '营运资本变化', value: -asNumber(values, 'workingCapitalChange') },
        ],
        bars: [{ key: 'value', label: '金额', color: chartColors[0] }],
      },
    ],
    narrative: 'Owner Earnings 更强调企业实际可分配给股东的现金，而不是会计利润本身。',
  };
};

const computeDdm = (values: Record<string, number | string>): ToolResult => {
  const currentDividend = asNumber(values, 'currentDividend');
  const shortGrowth = asRate(values, 'shortGrowthRate');
  const years = Math.round(asNumber(values, 'years'));
  const requiredReturn = asRate(values, 'requiredReturn');
  const perpetualGrowth = asRate(values, 'perpetualGrowthRate');
  const dividends = Array.from({ length: years }, (_, index) => currentDividend * (1 + shortGrowth) ** (index + 1));
  const presentDividends = dividends.map((dividend, index) => discount(dividend, requiredReturn, index + 1));
  const terminalValue = safeDivide(dividends[dividends.length - 1] * (1 + perpetualGrowth), requiredReturn - perpetualGrowth);
  const intrinsicValue = sum(presentDividends) + discount(terminalValue, requiredReturn, years);
  const currentPrice = asNumber(values, 'currentPrice');
  const premium = safeDivide(currentPrice - intrinsicValue, intrinsicValue);

  return {
    summary: [
      { label: 'DDM 合理股价', value: formatCurrency(intrinsicValue) },
      { label: '当前溢价率', value: formatPercent(premium), tone: sentiment(-premium) },
      { label: '股息收益率', value: formatPercent(safeDivide(currentDividend, currentPrice)) },
    ],
    details: [
      { label: '短期股息现值', value: formatCurrency(sum(presentDividends)) },
      { label: '终值现值', value: formatCurrency(discount(terminalValue, requiredReturn, years)) },
      { label: '要求回报率', value: formatPercent(requiredReturn) },
      { label: '永续增长率', value: formatPercent(perpetualGrowth) },
    ],
    charts: [
      {
        type: 'line',
        title: '股息路径',
        xKey: 'year',
        data: dividends.map((dividend, index) => ({
          year: `Y${index + 1}`,
          dividend: Number(dividend.toFixed(2)),
          pv: Number(presentDividends[index].toFixed(2)),
        })),
        lines: [
          { key: 'dividend', label: '股息', color: chartColors[0] },
          { key: 'pv', label: '现值', color: chartColors[2] },
        ],
      },
    ],
    narrative: 'DDM 适合分红政策稳定的成熟企业，对折现率与永续增长率同样敏感。',
  };
};

const computeMultiples = (values: Record<string, number | string>): ToolResult => {
  const metrics = [
    ['PE', 'targetPe', 'peersPe'],
    ['P/FCF', 'targetPfcf', 'peersPfcf'],
    ['PB', 'targetPb', 'peersPb'],
    ['PS', 'targetPs', 'peersPs'],
    ['EV/EBITDA', 'targetEvEbitda', 'peersEvEbitda'],
    ['EV/EBIT', 'targetEvEbit', 'peersEvEbit'],
    ['EV/NOPAT', 'targetEvNopat', 'peersEvNopat'],
    ['Price/OE', 'targetPriceOe', 'peersPriceOe'],
  ] as const;

  const rows = metrics.map(([label, targetKey, peersKey]) => {
    const target = asNumber(values, targetKey);
    const peers = asSeries(values, peersKey);
    const peerMedian = median(peers);
    const deviation = safeDivide(target, peerMedian) - 1;
    return {
      label,
      target,
      peerMedian,
      deviation,
      peerCount: peers.length,
    };
  });

  const overallDeviation = average(rows.map((row) => row.deviation));

  return {
    summary: [
      {
        label: '综合估值偏离',
        value: formatPercent(overallDeviation),
        tone: sentiment(-overallDeviation),
      },
      {
        label: '估值判断',
        value: valueJudgement(1 + overallDeviation),
        tone: overallDeviation < 0 ? 'positive' : 'negative',
      },
      {
        label: '同行中位数样本数',
        value: formatPlain(average(rows.map((row) => row.peerCount)), 0),
      },
    ],
    details: rows.map((row) => ({
      label: row.label,
      value: `${formatMultiple(row.target)} vs ${formatMultiple(row.peerMedian)}`,
      hint: `偏离 ${formatPercent(row.deviation)}`,
    })),
    charts: [
      {
        type: 'bar',
        title: '目标公司 vs 同行中位数',
        xKey: 'metric',
        data: rows.map((row) => ({
          metric: row.label,
          target: Number(row.target.toFixed(2)),
          median: Number(row.peerMedian.toFixed(2)),
        })),
        bars: [
          { key: 'target', label: '目标公司', color: chartColors[0] },
          { key: 'median', label: '同行中位数', color: chartColors[2] },
        ],
      },
      {
        type: 'radar',
        title: '倍数位置雷达图',
        angleKey: 'metric',
        data: rows.map((row) => ({
          metric: row.label,
          目标公司: Number(row.target.toFixed(2)),
          同行中位数: Number(row.peerMedian.toFixed(2)),
        })),
        series: [
          { key: '目标公司', label: '目标公司', color: chartColors[0] },
          { key: '同行中位数', label: '同行中位数', color: chartColors[2] },
        ],
      },
    ],
    narrative: overallDeviation < 0 ? '目标公司多数倍数低于同行中位数。' : '目标公司整体倍数高于同行中位数，需更强增长或更高质量支撑。',
  };
};

const computeValuationBands = (values: Record<string, number | string>): ToolResult => {
  const history = asSeries(values, 'historySeries');
  const currentMultiple = asNumber(values, 'currentMultiple');
  const currentPercentile = percentile(history, currentMultiple);
  const sorted = [...history].sort((left, right) => left - right);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] || 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] || 0;

  return {
    summary: [
      { label: '历史分位数', value: formatPercent(currentPercentile) },
      { label: '历史中位数', value: formatMultiple(median(history)) },
      {
        label: '当前估值区间',
        value: currentMultiple < q1 ? '历史低位' : currentMultiple > q3 ? '历史高位' : '中性区间',
        tone: currentMultiple < q1 ? 'positive' : currentMultiple > q3 ? 'negative' : 'neutral',
      },
    ],
    details: [
      { label: '当前倍数', value: formatMultiple(currentMultiple) },
      { label: '历史低位 / 高位', value: `${formatMultiple(sorted[0] || 0)} / ${formatMultiple(sorted[sorted.length - 1] || 0)}` },
      { label: '四分位区间', value: `${formatMultiple(q1)} - ${formatMultiple(q3)}` },
    ],
    charts: [
      {
        type: 'line',
        title: '10 年估值带',
        xKey: 'year',
        data: history.map((value, index) => ({
          year: `Y${index + 1}`,
          multiple: Number(value.toFixed(2)),
          current: Number(currentMultiple.toFixed(2)),
        })),
        lines: [
          { key: 'multiple', label: '历史倍数', color: chartColors[0] },
          { key: 'current', label: '当前倍数', color: chartColors[3] },
        ],
      },
    ],
    narrative: '历史估值带能帮助你判断现在贵不贵，但必须结合盈利质量与利率环境一起看。',
  };
};

const computeExpectedReturn = (values: Record<string, number | string>): ToolResult => {
  const fcfYield = asRate(values, 'fcfYield');
  const growth = asRate(values, 'growthRate');
  const buybackYield = asRate(values, 'buybackYield');
  const rerating = asRate(values, 'reratingChange');
  const expectedReturn = fcfYield + growth + buybackYield + rerating;

  return {
    summary: [
      { label: '预期 CAGR', value: formatPercent(expectedReturn), note: '持有期收益率的近似拆解' },
      { label: '现金收益贡献', value: formatPercent(fcfYield) },
      { label: '估值变化贡献', value: formatPercent(rerating), tone: sentiment(rerating) },
    ],
    details: [
      { label: 'FCF Yield', value: formatPercent(fcfYield) },
      { label: '增长率', value: formatPercent(growth) },
      { label: '回购收益率', value: formatPercent(buybackYield) },
      { label: '估值重估', value: formatPercent(rerating) },
    ],
    charts: [
      {
        type: 'bar',
        title: '收益来源拆解',
        xKey: 'name',
        data: [
          { name: 'FCF Yield', value: fcfYield * 100 },
          { name: '增长', value: growth * 100 },
          { name: '回购', value: buybackYield * 100 },
          { name: '重估', value: rerating * 100 },
        ],
        bars: [{ key: 'value', label: '贡献 %', color: chartColors[0] }],
      },
    ],
    narrative: '这个工具适合把“为什么能赚钱”拆成几个更可验证的来源，而不是只看单一目标价。',
  };
};

const computeMagicFormula = (values: Record<string, number | string>): ToolResult => {
  const earningsYield = safeDivide(asNumber(values, 'ebit'), asNumber(values, 'enterpriseValue'));
  const roc = safeDivide(asNumber(values, 'ebit'), asNumber(values, 'netWorkingCapital') + asNumber(values, 'netFixedAssets'));
  const magicScore = safeDivide(1, Math.max(earningsYield * roc, 0.0001));

  return {
    summary: [
      { label: 'Earnings Yield', value: formatPercent(earningsYield) },
      { label: 'ROC', value: formatPercent(roc) },
      { label: 'Magic Score', value: formatNumber(magicScore, 2), note: '越低代表便宜且高质量的组合更强' },
    ],
    details: [
      { label: 'EV', value: formatCurrency(asNumber(values, 'enterpriseValue')) },
      { label: 'EBIT', value: formatCurrency(asNumber(values, 'ebit')) },
      { label: '净营运资本 + 固定资产', value: formatCurrency(asNumber(values, 'netWorkingCapital') + asNumber(values, 'netFixedAssets')) },
    ],
    charts: [
      {
        type: 'bar',
        title: 'Magic Formula 双因子',
        xKey: 'name',
        data: [
          { name: 'Earnings Yield', value: earningsYield * 100 },
          { name: 'ROC', value: roc * 100 },
        ],
        bars: [{ key: 'value', label: '%', color: chartColors[0] }],
      },
    ],
    narrative: 'Magic Formula 同时要求公司便宜且有高资本回报，因此很适合作为量化筛选的第一道过滤。',
  };
};

const computeAcquirersMultiple = (values: Record<string, number | string>): ToolResult => {
  const acquirersMultiple = safeDivide(asNumber(values, 'enterpriseValue'), asNumber(values, 'operatingEbit'));
  const peerMedian = median(asSeries(values, 'peerMultiples'));
  const peerGap = safeDivide(acquirersMultiple, peerMedian) - 1;

  return {
    summary: [
      { label: 'Acquirer\'s Multiple', value: formatMultiple(acquirersMultiple) },
      { label: '同行偏离', value: formatPercent(peerGap), tone: sentiment(-peerGap) },
      { label: '深度价值判断', value: acquirersMultiple <= 8 ? '符合深度价值' : '估值不算极低', tone: acquirersMultiple <= 8 ? 'positive' : 'neutral' },
    ],
    details: [
      { label: 'EV', value: formatCurrency(asNumber(values, 'enterpriseValue')) },
      { label: '经营性 EBIT', value: formatCurrency(asNumber(values, 'operatingEbit')) },
      { label: '同行中位数', value: formatMultiple(peerMedian) },
    ],
    charts: [
      {
        type: 'bar',
        title: '收购者视角倍数对比',
        xKey: 'name',
        data: [
          { name: '目标公司', value: acquirersMultiple },
          { name: '同行中位数', value: peerMedian },
        ],
        bars: [{ key: 'value', label: '倍数', color: chartColors[0] }],
      },
    ],
    narrative: '这个指标非常适合深度价值场景，但要确认 EBIT 没有被周期高点扭曲。',
  };
};

const computePiotroski = (values: Record<string, number | string>): ToolResult => {
  const checks = [
    ['ROA > 0', asNumber(values, 'roaCurrent') > 0],
    ['CFO > 0', asNumber(values, 'cfo') > 0],
    ['ROA 改善', asNumber(values, 'roaCurrent') > asNumber(values, 'roaPrior')],
    ['CFO > 净利润', asNumber(values, 'cfo') > asNumber(values, 'netIncome')],
    ['杠杆下降', asNumber(values, 'leverageCurrent') < asNumber(values, 'leveragePrior')],
    ['流动比率改善', asNumber(values, 'currentRatioCurrent') > asNumber(values, 'currentRatioPrior')],
    ['未增发', asNumber(values, 'sharesCurrent') <= asNumber(values, 'sharesPrior')],
    ['毛利率改善', asNumber(values, 'grossMarginCurrent') > asNumber(values, 'grossMarginPrior')],
    ['周转率改善', asNumber(values, 'assetTurnoverCurrent') > asNumber(values, 'assetTurnoverPrior')],
  ] as const;
  const score = checks.filter(([, passed]) => passed).length;
  const band = score >= 8 ? '强' : score >= 5 ? '中' : '弱';

  return {
    summary: [
      { label: 'F-Score', value: `${score} / 9`, tone: score >= 8 ? 'positive' : score <= 4 ? 'negative' : 'neutral' },
      { label: '质量判断', value: band },
      { label: '通过率', value: formatPercent(score / 9) },
    ],
    details: checks.map(([label, passed]) => ({
      label,
      value: passed ? '通过' : '未通过',
      hint: passed ? '当前趋势支持财务改善' : '需要进一步核对趋势来源',
    })),
    charts: [
      {
        type: 'bar',
        title: '九项因子结果',
        xKey: 'name',
        data: checks.map(([label, passed]) => ({ name: label, value: passed ? 1 : 0 })),
        bars: [{ key: 'value', label: '得分', color: chartColors[0] }],
      },
    ],
    narrative: 'Piotroski 最有价值的地方是把“便宜”与“经营改善”结合，减少价值陷阱。',
  };
};

const computeAltman = (values: Record<string, number | string>): ToolResult => {
  const totalAssets = asNumber(values, 'totalAssets');
  const x1 = safeDivide(asNumber(values, 'workingCapital'), totalAssets);
  const x2 = safeDivide(asNumber(values, 'retainedEarnings'), totalAssets);
  const x3 = safeDivide(asNumber(values, 'ebit'), totalAssets);
  const x4 = safeDivide(asNumber(values, 'marketValueEquity'), asNumber(values, 'totalLiabilities'));
  const x5 = safeDivide(asNumber(values, 'sales'), totalAssets);
  const z = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + x5;
  const zone = z > 2.99 ? '安全区' : z >= 1.81 ? '灰色区' : '危险区';

  return {
    summary: [
      { label: 'Altman Z-Score', value: formatNumber(z, 2), tone: z > 2.99 ? 'positive' : z < 1.81 ? 'negative' : 'neutral' },
      { label: '风险等级', value: zone },
      { label: 'X4 市值杠杆因子', value: formatNumber(x4, 2) },
    ],
    details: [
      { label: 'X1 营运资金 / 总资产', value: formatNumber(x1, 2) },
      { label: 'X2 留存收益 / 总资产', value: formatNumber(x2, 2) },
      { label: 'X3 EBIT / 总资产', value: formatNumber(x3, 2) },
      { label: 'X4 市值 / 总负债', value: formatNumber(x4, 2) },
      { label: 'X5 营收 / 总资产', value: formatNumber(x5, 2) },
    ],
    charts: [
      {
        type: 'bar',
        title: '五因子分解',
        xKey: 'name',
        data: [
          { name: 'X1', value: x1 },
          { name: 'X2', value: x2 },
          { name: 'X3', value: x3 },
          { name: 'X4', value: x4 },
          { name: 'X5', value: x5 },
        ],
        bars: [{ key: 'value', label: '因子值', color: chartColors[0] }],
      },
    ],
    narrative: 'Z-Score 是破产预警工具，不适合拿来判断企业是不是“好公司”，但对债务风险很有用。',
  };
};

const computeDupont = (values: Record<string, number | string>): ToolResult => {
  const revenue = asNumber(values, 'revenue');
  const netIncome = asNumber(values, 'netIncome');
  const averageAssets = asNumber(values, 'averageAssets');
  const averageEquity = asNumber(values, 'averageEquity');
  const ebit = asNumber(values, 'ebit');
  const pretaxIncome = asNumber(values, 'pretaxIncome');
  const netMargin = safeDivide(netIncome, revenue);
  const assetTurnover = safeDivide(revenue, averageAssets);
  const equityMultiplier = safeDivide(averageAssets, averageEquity);
  const roe3 = netMargin * assetTurnover * equityMultiplier;
  const taxBurden = safeDivide(netIncome, pretaxIncome);
  const interestBurden = safeDivide(pretaxIncome, ebit);
  const operatingMargin = safeDivide(ebit, revenue);
  const roe5 = taxBurden * interestBurden * operatingMargin * assetTurnover * equityMultiplier;

  const drivers: Array<[string, number]> = [];
  drivers.push(['净利率', netMargin]);
  drivers.push(['资产周转率', assetTurnover]);
  drivers.push(['权益乘数', equityMultiplier]);
  drivers.sort((left, right) => right[1] - left[1]);

  return {
    summary: [
      { label: '三因子 ROE', value: formatPercent(roe3) },
      { label: '五因子 ROE', value: formatPercent(roe5) },
      { label: '主驱动', value: String(drivers[0][0]) },
    ],
    details: [
      { label: '净利率', value: formatPercent(netMargin) },
      { label: '资产周转率', value: formatNumber(assetTurnover, 2) },
      { label: '权益乘数', value: formatNumber(equityMultiplier, 2) },
      { label: '税负率', value: formatNumber(taxBurden, 2) },
      { label: '利息负担率', value: formatNumber(interestBurden, 2) },
    ],
    charts: [
      {
        type: 'bar',
        title: 'ROE 驱动因子',
        xKey: 'name',
        data: [
          { name: '净利率', value: netMargin * 100 },
          { name: '资产周转率', value: assetTurnover },
          { name: '权益乘数', value: equityMultiplier },
        ],
        bars: [{ key: 'value', label: '因子值', color: chartColors[0] }],
      },
    ],
    narrative: '杜邦分析最适合回答一个问题：公司的高 ROE 究竟来自利润率、周转效率，还是杠杆。',
  };
};

const computeRoicWacc = (values: Record<string, number | string>): ToolResult => {
  const taxRate = asRate(values, 'taxRate');
  const nopat = asNumber(values, 'ebit') * (1 - taxRate);
  const investedCapital = asNumber(values, 'equityValue') + asNumber(values, 'debtValue') - asNumber(values, 'cash');
  const roic = safeDivide(nopat, investedCapital);
  const rf = asRate(values, 'riskFreeRate');
  const erp = asRate(values, 'equityRiskPremium');
  const beta = asNumber(values, 'beta');
  const re = rf + beta * erp;
  const rd = safeDivide(asNumber(values, 'interestExpense'), asNumber(values, 'averageDebt'));
  const totalCapital = asNumber(values, 'equityValue') + asNumber(values, 'debtValue');
  const wacc = safeDivide(asNumber(values, 'equityValue'), totalCapital) * re + safeDivide(asNumber(values, 'debtValue'), totalCapital) * rd * (1 - taxRate);
  const spread = roic - wacc;
  const economicProfit = spread * investedCapital;

  return {
    summary: [
      { label: 'ROIC', value: formatPercent(roic) },
      { label: 'WACC', value: formatPercent(wacc) },
      { label: '价值创造利差', value: formatPercent(spread), tone: sentiment(spread) },
    ],
    details: [
      { label: 'NOPAT', value: formatCurrency(nopat) },
      { label: '投入资本', value: formatCurrency(investedCapital) },
      { label: '经济利润', value: formatCurrency(economicProfit) },
      { label: '股权成本 / 债务成本', value: `${formatPercent(re)} / ${formatPercent(rd)}` },
    ],
    charts: [
      {
        type: 'bar',
        title: 'ROIC vs WACC',
        xKey: 'name',
        data: [
          { name: 'ROIC', value: roic * 100 },
          { name: 'WACC', value: wacc * 100 },
          { name: 'Spread', value: spread * 100 },
        ],
        bars: [{ key: 'value', label: '%', color: chartColors[0] }],
      },
    ],
    narrative: spread > 0.05 ? '企业正在持续创造超额回报。' : '若利差长期偏小，估值需要更多依赖增长而不是护城河。',
  };
};

const computeFcfQuality = (values: Record<string, number | string>): ToolResult => {
  const fcf = asNumber(values, 'operatingCashFlow') - asNumber(values, 'capitalExpenditure');
  const conversion = safeDivide(fcf, asNumber(values, 'netIncome'));
  const sloanRatio = safeDivide(asNumber(values, 'netIncome') - fcf, asNumber(values, 'totalAssets'));
  const cashCycle = asNumber(values, 'receivableDays') + asNumber(values, 'inventoryDays') - asNumber(values, 'payableDays');
  const score = clamp(100 - Math.max(0, (0.8 - conversion) * 80) - Math.max(0, sloanRatio * 300) - Math.max(0, (cashCycle - 60) * 0.5), 0, 100);

  return {
    summary: [
      { label: '盈利质量评分', value: `${formatPlain(score, 0)} / 100`, tone: score >= 75 ? 'positive' : score <= 45 ? 'negative' : 'neutral' },
      { label: 'FCF 转化率', value: formatPercent(conversion) },
      { label: 'Sloan Ratio', value: formatPercent(sloanRatio), tone: sentiment(-sloanRatio) },
    ],
    details: [
      { label: '自由现金流', value: formatCurrency(fcf) },
      { label: '现金循环周期', value: `${formatPlain(cashCycle, 0)} 天` },
      { label: '经营现金流', value: formatCurrency(asNumber(values, 'operatingCashFlow')) },
      { label: '资本开支', value: formatCurrency(asNumber(values, 'capitalExpenditure')) },
    ],
    charts: [
      {
        type: 'bar',
        title: '盈利质量指标',
        xKey: 'name',
        data: [
          { name: 'FCF 转化率', value: conversion * 100 },
          { name: 'Sloan Ratio', value: sloanRatio * 100 },
          { name: 'CCC', value: cashCycle },
        ],
        bars: [{ key: 'value', label: '值', color: chartColors[0] }],
      },
    ],
    narrative: score >= 75 ? '利润与现金流匹配度较好。' : '如果 FCF 转化率偏弱且 Sloan Ratio 偏高，需要警惕应计利润积累。',
  };
};

const computeDebtHealth = (values: Record<string, number | string>): ToolResult => {
  const netDebtToEbitda = safeDivide(asNumber(values, 'netDebt'), asNumber(values, 'ebitda'));
  const interestCoverage = safeDivide(asNumber(values, 'ebit'), asNumber(values, 'interestExpense'));
  const currentRatio = safeDivide(asNumber(values, 'currentAssets'), asNumber(values, 'currentLiabilities'));
  const quickRatio = safeDivide(asNumber(values, 'currentAssets') - asNumber(values, 'inventory'), asNumber(values, 'currentLiabilities'));
  const debtToEquity = safeDivide(asNumber(values, 'totalDebt'), asNumber(values, 'totalEquity'));
  const score =
    clamp(100 - Math.max(0, (netDebtToEbitda - 2) * 18), 0, 100) * 0.25 +
    clamp(interestCoverage * 10, 0, 100) * 0.25 +
    clamp(currentRatio * 50, 0, 100) * 0.2 +
    clamp(quickRatio * 50, 0, 100) * 0.15 +
    clamp(100 - debtToEquity * 30, 0, 100) * 0.15;
  const grade = letterGrade(score);

  return {
    summary: [
      { label: '债务等级', value: grade, tone: gradeTone(grade) },
      { label: '净债务 / EBITDA', value: formatMultiple(netDebtToEbitda) },
      { label: '利息覆盖率', value: formatMultiple(interestCoverage) },
    ],
    details: [
      { label: '流动比率', value: formatNumber(currentRatio, 2) },
      { label: '速动比率', value: formatNumber(quickRatio, 2) },
      { label: '债务 / 权益', value: formatNumber(debtToEquity, 2) },
      { label: '综合评分', value: formatPlain(score, 0) },
    ],
    charts: [
      {
        type: 'radar',
        title: '五项债务评分',
        angleKey: 'metric',
        data: [
          { metric: '净债务', 目标: clamp(100 - netDebtToEbitda * 20, 0, 100) },
          { metric: '利息覆盖', 目标: clamp(interestCoverage * 10, 0, 100) },
          { metric: '流动性', 目标: clamp(currentRatio * 50, 0, 100) },
          { metric: '速动性', 目标: clamp(quickRatio * 50, 0, 100) },
          { metric: '资本结构', 目标: clamp(100 - debtToEquity * 30, 0, 100) },
        ],
        series: [{ key: '目标', label: '目标', color: chartColors[0] }],
      },
    ],
    narrative: grade === 'A' ? '债务结构稳健，短期偿债与长期杠杆都处于健康区间。' : '若债务质量偏弱，需要把行业波动和再融资窗口一起纳入判断。',
  };
};

const computeCapitalAllocation = (values: Record<string, number | string>): ToolResult => {
  const roicSeries = asPercentSeries(values, 'roicSeries');
  const sharesSeries = asSeries(values, 'sharesSeries');
  const dividendsSeries = asSeries(values, 'dividendsSeries');
  const fcfPerShareSeries = asSeries(values, 'fcfPerShareSeries');
  const avgRoic = average(roicSeries);
  const shareCountChange = cagr(sharesSeries[0] || 1, sharesSeries[sharesSeries.length - 1] || 1, Math.max(sharesSeries.length - 1, 1));
  const dividendGrowth = cagr(dividendsSeries[0] || 1, dividendsSeries[dividendsSeries.length - 1] || 1, Math.max(dividendsSeries.length - 1, 1));
  const fcfPerShareGrowth = cagr(fcfPerShareSeries[0] || 1, fcfPerShareSeries[fcfPerShareSeries.length - 1] || 1, Math.max(fcfPerShareSeries.length - 1, 1));
  const score = clamp(avgRoic * 100 * 0.4 + (-shareCountChange * 100) * 1.2 + dividendGrowth * 100 * 0.2 + fcfPerShareGrowth * 100 * 0.4, 0, 100);
  const grade = letterGrade(score);

  return {
    summary: [
      { label: '资本配置评级', value: grade, tone: gradeTone(grade) },
      { label: '平均 ROIC', value: formatPercent(avgRoic) },
      { label: 'FCF / 股 CAGR', value: formatPercent(fcfPerShareGrowth), tone: sentiment(fcfPerShareGrowth) },
    ],
    details: [
      { label: '股份数 CAGR', value: formatPercent(shareCountChange), hint: '负值代表回购' },
      { label: '股息 CAGR', value: formatPercent(dividendGrowth) },
      { label: '综合评分', value: formatPlain(score, 0) },
    ],
    charts: [
      {
        type: 'line',
        title: '资本配置趋势',
        xKey: 'year',
        data: roicSeries.map((roic, index) => ({
          year: `Y${index + 1}`,
          roic: Number((roic * 100).toFixed(2)),
          shares: Number((sharesSeries[index] || 0).toFixed(2)),
          fcfPerShare: Number((fcfPerShareSeries[index] || 0).toFixed(2)),
        })),
        lines: [
          { key: 'roic', label: 'ROIC %', color: chartColors[0] },
          { key: 'fcfPerShare', label: 'FCF / 股', color: chartColors[2] },
        ],
      },
    ],
    narrative: '资本配置能力最终要落到每股价值，而不是绝对利润增长。',
  };
};

const computeDilution = (values: Record<string, number | string>): ToolResult => {
  const sharesSeries = asSeries(values, 'sharesSeries');
  const revenueSeries = asSeries(values, 'revenueSeries');
  const fcfSeries = asSeries(values, 'fcfSeries');
  const sbcToRevenue = asRate(values, 'sbcToRevenue');
  const dilutionCagr = cagr(sharesSeries[0] || 1, sharesSeries[sharesSeries.length - 1] || 1, Math.max(sharesSeries.length - 1, 1));
  const revenuePerShareSeries = revenueSeries.map((value, index) => safeDivide(value, sharesSeries[index] || 1));
  const fcfPerShareSeries = fcfSeries.map((value, index) => safeDivide(value, sharesSeries[index] || 1));
  const revenuePerShareCagr = cagr(revenuePerShareSeries[0] || 1, revenuePerShareSeries[revenuePerShareSeries.length - 1] || 1, Math.max(revenuePerShareSeries.length - 1, 1));
  const fcfPerShareCagr = cagr(fcfPerShareSeries[0] || 1, fcfPerShareSeries[fcfPerShareSeries.length - 1] || 1, Math.max(fcfPerShareSeries.length - 1, 1));
  const score = clamp(100 - dilutionCagr * 100 * 6 - sbcToRevenue * 100 * 2 + revenuePerShareCagr * 100 * 2 + fcfPerShareCagr * 100 * 2, 0, 100);
  const grade = letterGrade(score);

  return {
    summary: [
      { label: '稀释评级', value: grade, tone: gradeTone(grade) },
      { label: '稀释 CAGR', value: formatPercent(dilutionCagr), tone: sentiment(-dilutionCagr) },
      { label: 'FCF / 股 CAGR', value: formatPercent(fcfPerShareCagr), tone: sentiment(fcfPerShareCagr) },
    ],
    details: [
      { label: '营收 / 股 CAGR', value: formatPercent(revenuePerShareCagr) },
      { label: 'SBC / 营收', value: formatPercent(sbcToRevenue) },
      { label: '综合评分', value: formatPlain(score, 0) },
    ],
    charts: [
      {
        type: 'line',
        title: '股份与每股价值趋势',
        xKey: 'year',
        data: sharesSeries.map((shares, index) => ({
          year: `Y${index + 1}`,
          shares: Number(shares.toFixed(2)),
          revenuePerShare: Number((revenuePerShareSeries[index] || 0).toFixed(2)),
          fcfPerShare: Number((fcfPerShareSeries[index] || 0).toFixed(2)),
        })),
        lines: [
          { key: 'revenuePerShare', label: '营收 / 股', color: chartColors[0] },
          { key: 'fcfPerShare', label: 'FCF / 股', color: chartColors[2] },
        ],
      },
    ],
    narrative: dilutionCagr > 0.03 ? '股本扩张较快，必须确认它是否真正换来了更快的每股价值增长。' : '若股份趋于收缩，每股价值增长的含金量会更高。',
  };
};

const computeCagrReinvestment = (values: Record<string, number | string>): ToolResult => {
  const revenueSeries = asSeries(values, 'revenueSeries');
  const fcfSeries = asSeries(values, 'fcfSeries');
  const epsSeries = asSeries(values, 'epsSeries');
  const revCagr = cagr(revenueSeries[0] || 1, revenueSeries[revenueSeries.length - 1] || 1, Math.max(revenueSeries.length - 1, 1));
  const fcfCagr = cagr(fcfSeries[0] || 1, fcfSeries[fcfSeries.length - 1] || 1, Math.max(fcfSeries.length - 1, 1));
  const epsCagr = cagr(epsSeries[0] || 1, epsSeries[epsSeries.length - 1] || 1, Math.max(epsSeries.length - 1, 1));
  const reinvestmentRate = safeDivide(asNumber(values, 'netCapex') + asNumber(values, 'workingCapitalChange'), asNumber(values, 'nopat'));
  const sustainableGrowth = asRate(values, 'roic') * reinvestmentRate;

  return {
    summary: [
      { label: '营收 CAGR', value: formatPercent(revCagr) },
      { label: '可持续增长率', value: formatPercent(sustainableGrowth), tone: sentiment(sustainableGrowth - revCagr) },
      { label: 'EPS CAGR', value: formatPercent(epsCagr) },
    ],
    details: [
      { label: 'FCF CAGR', value: formatPercent(fcfCagr) },
      { label: '再投资率', value: formatPercent(reinvestmentRate) },
      { label: 'ROIC', value: formatPercentPoint(asNumber(values, 'roic')) },
    ],
    charts: [
      {
        type: 'bar',
        title: '增长率对比',
        xKey: 'name',
        data: [
          { name: '营收 CAGR', value: revCagr * 100 },
          { name: 'FCF CAGR', value: fcfCagr * 100 },
          { name: 'EPS CAGR', value: epsCagr * 100 },
          { name: '可持续增长率', value: sustainableGrowth * 100 },
        ],
        bars: [{ key: 'value', label: '%', color: chartColors[0] }],
      },
    ],
    narrative: '如果实际增长长期高于可持续增长率，通常要确认它是否依赖更高杠杆或更激进会计假设。',
  };
};

const computeGrossMarginTrend = (values: Record<string, number | string>): ToolResult => {
  const companyMargins = asSeries(values, 'companyMargins');
  const peerMargins = asSeries(values, 'peerMargins');
  const trend = safeDivide((companyMargins[companyMargins.length - 1] || 0) - (companyMargins[0] || 0), Math.max(companyMargins.length - 1, 1));
  const currentGap = (companyMargins[companyMargins.length - 1] || 0) - (peerMargins[peerMargins.length - 1] || 0);

  return {
    summary: [
      { label: '当前毛利率', value: formatPercentPoint(companyMargins[companyMargins.length - 1] || 0) },
      { label: '年均趋势', value: formatPercentPoint(trend), tone: sentiment(trend / 100) },
      { label: '同行差值', value: formatPercentPoint(currentGap), tone: sentiment(currentGap / 100) },
    ],
    details: [
      { label: '5 年平均毛利率', value: formatPercentPoint(average(companyMargins)) },
      { label: '同行平均毛利率', value: formatPercentPoint(average(peerMargins)) },
    ],
    charts: [
      {
        type: 'line',
        title: '毛利率趋势',
        xKey: 'year',
        data: companyMargins.map((margin, index) => ({
          year: `Y${index + 1}`,
          公司: margin,
          同行: peerMargins[index] || 0,
        })),
        lines: [
          { key: '公司', label: '公司', color: chartColors[0] },
          { key: '同行', label: '同行', color: chartColors[2] },
        ],
      },
    ],
    narrative: currentGap > 0 ? '高于同行且趋势改善，通常意味着定价权或产品结构在强化。' : '如果毛利率长期落后同行，护城河判断需要更谨慎。',
  };
};

const computeRuleOf40 = (values: Record<string, number | string>): ToolResult => {
  const growthSeries = asSeries(values, 'growthSeries');
  const marginSeries = asSeries(values, 'fcfMarginSeries');
  const scores = growthSeries.map((growth, index) => growth + (marginSeries[index] || 0));
  const currentScore = scores[scores.length - 1] || 0;

  return {
    summary: [
      { label: '当前 Rule of 40', value: formatPercentPoint(currentScore), tone: currentScore >= 40 ? 'positive' : currentScore < 20 ? 'negative' : 'neutral' },
      { label: '历史平均', value: formatPercentPoint(average(scores)) },
      { label: '健康判断', value: currentScore >= 40 ? '健康' : currentScore >= 20 ? '一般' : '需关注' },
    ],
    details: growthSeries.map((growth, index) => ({
      label: `Y${index + 1}`,
      value: `${formatPercentPoint(growth)} + ${formatPercentPoint(marginSeries[index] || 0)} = ${formatPercentPoint(scores[index] || 0)}`,
    })),
    charts: [
      {
        type: 'line',
        title: 'Rule of 40 历史趋势',
        xKey: 'year',
        data: scores.map((score, index) => ({
          year: `Y${index + 1}`,
          score,
        })),
        lines: [{ key: 'score', label: 'Rule of 40', color: chartColors[0] }],
      },
    ],
    narrative: '这项指标适合 SaaS 和高成长科技公司，用来平衡增长和现金流质量。',
  };
};

const computePeg = (values: Record<string, number | string>): ToolResult => {
  const pe = asNumber(values, 'pe');
  const growth = asNumber(values, 'growthRate');
  const peg = safeDivide(pe, growth);

  return {
    summary: [
      { label: 'PEG', value: formatNumber(peg, 2), tone: peg < 1 ? 'positive' : peg > 2 ? 'negative' : 'neutral' },
      { label: 'Lynch 判断', value: peg < 1 ? '可能低估' : peg > 2 ? '偏贵' : '大致合理' },
      { label: '对应合理 PE', value: formatMultiple(growth) },
    ],
    details: [
      { label: '当前 PE', value: formatMultiple(pe) },
      { label: '增长率', value: formatPercentPoint(growth) },
    ],
    charts: [
      {
        type: 'bar',
        title: 'PE 与增长对比',
        xKey: 'name',
        data: [
          { name: 'PE', value: pe },
          { name: '增长率', value: growth },
        ],
        bars: [{ key: 'value', label: '值', color: chartColors[0] }],
      },
    ],
    narrative: 'PEG 的前提是增长质量可靠，因此在周期股和利润波动较大的公司上参考意义有限。',
  };
};

const computeCyclicality = (values: Record<string, number | string>): ToolResult => {
  const revenues = asSeries(values, 'revenueSeries');
  const margins = asPercentSeries(values, 'marginSeries');
  const currentRevenue = revenues[revenues.length - 1] || 0;
  const currentMargin = margins[margins.length - 1] || 0;
  const currentEbit = currentRevenue * currentMargin;
  const normalizedMargin = average(margins);
  const midCycleEbit = currentRevenue * normalizedMargin;
  const ev = asNumber(values, 'enterpriseValue');
  const currentMultiple = safeDivide(ev, currentEbit);
  const normalizedMultiple = safeDivide(ev, midCycleEbit);
  const volatility = standardDeviation(margins);

  return {
    summary: [
      { label: '周期风险', value: volatility > 0.05 ? '高' : volatility > 0.03 ? '中' : '低', tone: volatility > 0.05 ? 'negative' : 'neutral' },
      { label: '当前 EV / EBIT', value: formatMultiple(currentMultiple) },
      { label: '中周期 EV / EBIT', value: formatMultiple(normalizedMultiple) },
    ],
    details: [
      { label: '当前 EBIT', value: formatCurrency(currentEbit) },
      { label: '中周期 EBIT', value: formatCurrency(midCycleEbit) },
      { label: '10 年利润率波动', value: formatPercent(volatility) },
    ],
    charts: [
      {
        type: 'line',
        title: '周期利润率',
        xKey: 'year',
        data: margins.map((margin, index) => ({
          year: `Y${index + 1}`,
          margin: margin * 100,
        })),
        lines: [{ key: 'margin', label: 'EBIT 利润率 %', color: chartColors[0] }],
      },
    ],
    narrative: currentMultiple < normalizedMultiple ? '如果当前处在景气高点，表面上看起来便宜的倍数可能只是利润高点的错觉。' : '中周期估值更能反映这类企业的真实便宜程度。',
  };
};

const computeScenarioAnalysis = (values: Record<string, number | string>): ToolResult => {
  const baseFcf = asNumber(values, 'baseFcf');
  const netCash = asNumber(values, 'netCash');
  const shares = asNumber(values, 'sharesOutstanding');
  const terminalGrowth = asRate(values, 'terminalGrowthRate');
  const currentPrice = asNumber(values, 'currentPrice');
  const scenarios = [
    ['牛市', asRate(values, 'bullGrowthRate'), asRate(values, 'bullWacc'), 0.3],
    ['基准', asRate(values, 'baseGrowthRate'), asRate(values, 'baseWacc'), 0.5],
    ['熊市', asRate(values, 'bearGrowthRate'), asRate(values, 'bearWacc'), 0.2],
  ] as const;
  const rows = scenarios.map(([name, growth, wacc, weight]) => {
    const model = dcfModel(baseFcf, Array.from({ length: 5 }, () => growth), wacc, terminalGrowth, netCash, shares);
    return {
      name,
      weight,
      value: model.intrinsicValuePerShare,
    };
  });
  const expectedValue = sum(rows.map((row) => row.value * row.weight));
  const upside = safeDivide(expectedValue - currentPrice, currentPrice);

  return {
    summary: [
      { label: '加权期望估值', value: formatCurrency(expectedValue) },
      { label: '相对现价空间', value: formatPercent(upside), tone: sentiment(upside) },
      { label: '估值区间', value: `${formatCurrency(Math.min(...rows.map((row) => row.value)))} - ${formatCurrency(Math.max(...rows.map((row) => row.value)))}` },
    ],
    details: rows.map((row) => ({
      label: `${row.name}场景`,
      value: `${formatCurrency(row.value)}，权重 ${formatPercent(row.weight)}`,
    })),
    charts: [
      {
        type: 'bar',
        title: '三情景估值',
        xKey: 'name',
        data: rows.map((row) => ({ name: row.name, value: row.value })),
        bars: [{ key: 'value', label: '价格', color: chartColors[0] }],
      },
    ],
    narrative: '情景分析不是预测，而是把不同经营路径映射到估值区间，帮助你提前想清楚仓位决策。',
  };
};

const computeSensitivityMatrix = (values: Record<string, number | string>): ToolResult => {
  const baseFcf = asNumber(values, 'baseFcf');
  const growth = asRate(values, 'growthRate');
  const netCash = asNumber(values, 'netCash');
  const shares = asNumber(values, 'sharesOutstanding');
  const currentWacc = asNumber(values, 'wacc');
  const currentTerminal = asNumber(values, 'terminalGrowthRate');
  const waccRows = [-2, -1, 0, 1, 2].map((offset) => formatPercentPoint(currentWacc + offset));
  const terminalColumns = [0, 1, 2, 3, 4].map((value) => formatPercentPoint(value));
  const cells = waccRows.flatMap((rowLabel, rowIndex) =>
    terminalColumns.map((columnLabel, columnIndex) => {
      const model = dcfModel(
        baseFcf,
        Array.from({ length: 5 }, () => growth),
        (currentWacc + (rowIndex - 2)) / 100,
        columnIndex / 100,
        netCash,
        shares,
      );
      return {
        row: rowLabel,
        column: columnLabel,
        value: model.intrinsicValuePerShare,
      };
    }),
  );
  const centerCell = cells.find((cell) => cell.row === formatPercentPoint(currentWacc) && cell.column === formatPercentPoint(currentTerminal));

  return {
    summary: [
      { label: '当前假设估值', value: formatCurrency(centerCell?.value || 0) },
      { label: '矩阵最低值', value: formatCurrency(Math.min(...cells.map((cell) => cell.value))) },
      { label: '矩阵最高值', value: formatCurrency(Math.max(...cells.map((cell) => cell.value))) },
    ],
    details: [
      { label: 'WACC 中心值', value: formatPercentPoint(currentWacc) },
      { label: '永续增长中心值', value: formatPercentPoint(currentTerminal) },
      { label: '基础 FCF', value: formatCurrency(baseFcf) },
    ],
    charts: [
      {
        type: 'heatmap',
        title: 'WACC × 永续增长率热力矩阵',
        rows: waccRows,
        columns: terminalColumns,
        cells,
        highlight: {
          row: formatPercentPoint(currentWacc),
          column: formatPercentPoint(currentTerminal),
        },
      },
    ],
    narrative: '敏感度矩阵的意义不是找到一个精确点，而是确认估值在一组合理假设下是否仍然站得住。',
  };
};

const computeKelly = (values: Record<string, number | string>): ToolResult => {
  const winRate = asRate(values, 'winRate');
  const payoffRatio = asNumber(values, 'payoffRatio');
  const rawKelly = safeDivide(winRate * payoffRatio - (1 - winRate), payoffRatio);
  const fullKelly = Math.max(rawKelly, 0);
  const halfKelly = fullKelly / 2;

  return {
    summary: [
      { label: 'Full Kelly', value: formatPercent(fullKelly), tone: fullKelly > 0.25 ? 'negative' : 'neutral' },
      { label: 'Half Kelly', value: formatPercent(halfKelly) },
      { label: '风险提示', value: fullKelly > 0.25 ? '仓位偏激进' : fullKelly === 0 ? '胜率/赔率不足' : '仓位可控' },
    ],
    details: [
      { label: '胜率 p', value: formatPercent(winRate) },
      { label: '盈亏比 b', value: formatNumber(payoffRatio, 2) },
      { label: '公式结果', value: formatPercent(rawKelly) },
    ],
    charts: [
      {
        type: 'bar',
        title: '仓位建议',
        xKey: 'name',
        data: [
          { name: 'Full Kelly', value: fullKelly * 100 },
          { name: 'Half Kelly', value: halfKelly * 100 },
        ],
        bars: [{ key: 'value', label: '仓位 %', color: chartColors[0] }],
      },
    ],
    narrative: 'Kelly 用来控制“多大仓位值得下”，而不是判断“这笔投资值不值得做”。',
  };
};

const computeMarginOfSafety = (values: Record<string, number | string>): ToolResult => {
  const methods = [
    ['DCF', asNumber(values, 'dcfValue'), asNumber(values, 'dcfWeight')],
    ['Graham', asNumber(values, 'grahamValue'), asNumber(values, 'grahamWeight')],
    ['Multiples', asNumber(values, 'multiplesValue'), asNumber(values, 'multiplesWeight')],
    ['DDM', asNumber(values, 'ddmValue'), asNumber(values, 'ddmWeight')],
    ['Custom', asNumber(values, 'customValue'), asNumber(values, 'customWeight')],
  ] as const;
  const totalWeight = sum(methods.map(([, , weight]) => weight));
  const weightedValue = safeDivide(sum(methods.map(([, value, weight]) => value * weight)), totalWeight);
  const currentPrice = asNumber(values, 'currentPrice');
  const margin = safeDivide(weightedValue - currentPrice, weightedValue);

  return {
    summary: [
      { label: '加权内在价值', value: formatCurrency(weightedValue) },
      { label: '综合安全边际', value: formatPercent(margin), tone: sentiment(margin) },
      { label: 'Graham 33% 参考', value: margin >= 0.33 ? '高于参考线' : '低于参考线' },
    ],
    details: methods.map(([name, value, weight]) => ({
      label: name,
      value: `${formatCurrency(value)}，权重 ${formatPlain(weight, 0)}`,
    })),
    charts: [
      {
        type: 'pie',
        title: '权重分布',
        data: methods.map(([name, , weight], index) => ({
          name,
          value: weight,
          color: chartColors[index % chartColors.length],
        })),
      },
      {
        type: 'bar',
        title: '各估值方法结果',
        xKey: 'name',
        data: methods.map(([name, value]) => ({ name, value })),
        bars: [{ key: 'value', label: '价格', color: chartColors[0] }],
      },
    ],
    narrative: '安全边际汇总器的价值在于把不同估值方法的误差来源做分散，而不是追求某一个模型最“准”。',
  };
};

const computeWaccTool = (values: Record<string, number | string>): ToolResult => {
  const equityValue = asNumber(values, 'equityValue');
  const debtValue = asNumber(values, 'debtValue');
  const taxRate = asRate(values, 'taxRate');
  const rf = asRate(values, 'riskFreeRate');
  const beta = asNumber(values, 'beta');
  const erp = asRate(values, 'equityRiskPremium');
  const costOfEquity = rf + beta * erp;
  const costOfDebt = safeDivide(asNumber(values, 'interestExpense'), asNumber(values, 'averageDebt'));
  const total = equityValue + debtValue;
  const wacc = safeDivide(equityValue, total) * costOfEquity + safeDivide(debtValue, total) * costOfDebt * (1 - taxRate);
  const betaScenarios = [beta - 0.3, beta, beta + 0.3, beta + 0.6].map((value) => clamp(value, 0.1, 3));

  return {
    summary: [
      { label: 'WACC', value: formatPercent(wacc) },
      { label: '股权成本', value: formatPercent(costOfEquity) },
      { label: '税后债务成本', value: formatPercent(costOfDebt * (1 - taxRate)) },
    ],
    details: [
      { label: 'E / V', value: formatPercent(safeDivide(equityValue, total)) },
      { label: 'D / V', value: formatPercent(safeDivide(debtValue, total)) },
      { label: '税率', value: formatPercent(taxRate) },
    ],
    charts: [
      {
        type: 'bar',
        title: '不同 Beta 下的 WACC',
        xKey: 'name',
        data: betaScenarios.map((scenario) => ({
          name: `β ${formatNumber(scenario, 1)}`,
          value:
            (safeDivide(equityValue, total) * (rf + scenario * erp) +
              safeDivide(debtValue, total) * costOfDebt * (1 - taxRate)) *
            100,
        })),
        bars: [{ key: 'value', label: 'WACC %', color: chartColors[0] }],
      },
    ],
    narrative: 'WACC 不应该被机械地设成一个常数，至少要用 Beta 或资本结构做一轮敏感度检查。',
  };
};

const computeCompounder = (values: Record<string, number | string>): ToolResult => {
  const initial = asNumber(values, 'initialCapital');
  const annualContribution = asNumber(values, 'annualContribution');
  const years = Math.round(asNumber(values, 'years'));
  const scenarios = [
    ['保守', asRate(values, 'conservativeRate')],
    ['基准', asRate(values, 'baseRate')],
    ['进取', asRate(values, 'aggressiveRate')],
  ] as const;
  const trajectories = scenarios.map(([label, rate]) => {
    let balance = initial;
    const series = [] as Array<{ year: string; value: number }>;
    for (let year = 1; year <= years; year += 1) {
      balance = balance * (1 + rate) + annualContribution;
      series.push({ year: `Y${year}`, value: balance });
    }
    return { label, rate, finalValue: balance, series };
  });
  const base = trajectories.find((trajectory) => trajectory.label === '基准');
  const contributions = initial + annualContribution * years;
  const gains = (base?.finalValue || 0) - contributions;

  return {
    summary: [
      { label: '基准终值', value: formatCurrency(base?.finalValue || 0) },
      { label: '收益占比', value: formatPercent(safeDivide(gains, base?.finalValue || 1)) },
      { label: '本息差额', value: formatCurrency(gains) },
    ],
    details: [
      { label: '本金 + 定投', value: formatCurrency(contributions) },
      { label: '保守终值', value: formatCurrency(trajectories[0].finalValue) },
      { label: '进取终值', value: formatCurrency(trajectories[2].finalValue) },
    ],
    charts: [
      {
        type: 'line',
        title: '复利轨迹',
        xKey: 'year',
        data: trajectories[0].series.map((point, index) => ({
          year: point.year,
          保守: Number(trajectories[0].series[index].value.toFixed(2)),
          基准: Number(trajectories[1].series[index].value.toFixed(2)),
          进取: Number(trajectories[2].series[index].value.toFixed(2)),
        })),
        lines: [
          { key: '保守', label: '保守', color: chartColors[3] },
          { key: '基准', label: '基准', color: chartColors[0] },
          { key: '进取', label: '进取', color: chartColors[1] },
        ],
      },
      {
        type: 'bar',
        title: '本金 vs 收益',
        xKey: 'name',
        data: [
          { name: '本金', value: contributions },
          { name: '收益', value: gains },
        ],
        bars: [{ key: 'value', label: '金额', color: chartColors[0] }],
      },
    ],
    narrative: '复利的核心不是找到一个极端高回报率，而是尽早开始并保持足够长的时间。',
  };
};

const createTool = (tool: Omit<ToolDefinition, 'route'>): ToolDefinition => ({
  ...tool,
  route: `/${tool.category}/${tool.slug}`,
});

export const categoryMeta: Record<ToolCategory, CategoryMeta> = {
  valuation: {
    label: '估值工具',
    description: '用现金流、倍数、股息和安全边际去回答“现在值多少钱”。',
    summary: '从两阶段 DCF 到历史估值带，把价格拆成可以核对的假设。',
    surfaceClass: 'bg-white',
  },
  health: {
    label: '财务健康',
    description: '识别便宜背后是机会还是陷阱。',
    summary: '涵盖 F-Score、Z-Score、ROIC/WACC、债务与现金流质量。',
    surfaceClass: 'bg-parchment',
  },
  growth: {
    label: '成长质量',
    description: '判断增长是否可持续，以及增长有没有转化成每股价值。',
    summary: '用 CAGR、毛利率、Rule of 40 和周期性识别增长质量。',
    surfaceClass: 'bg-white',
  },
  risk: {
    label: '风险工具',
    description: '在仓位和假设层面控制错误成本。',
    summary: '把敏感度、情景和仓位管理放到同一个工作台里。',
    surfaceClass: 'bg-tile text-white',
  },
  journal: {
    label: '投资记录',
    description: '把买入理由、卖出条件和复盘留在同一个地方。',
    summary: '本地优先、可导出，适合长期追踪自己的决策质量。',
    surfaceClass: 'bg-white',
  },
  tools: {
    label: '教育辅助',
    description: '补足 WACC、复利与数据管理等配套能力。',
    summary: '适合在研究流程中快速验证资本成本与长期收益路径。',
    surfaceClass: 'bg-parchment',
  },
};

export const toolCatalog: ToolDefinition[] = [
  createTool({
    id: 'dcf-two-stage',
    slug: 'dcf-two-stage',
    category: 'valuation',
    name: '两阶段 DCF 计算器',
    shortName: '两阶段 DCF',
    priority: 'P0',
    tagline: '成熟公司最常用的内在价值锚。',
    purpose: '适合增长稳定、商业模式清晰的成熟公司。它通过显性预测未来现金流，再把长期价值折现回来。',
    scenario: '当你能对未来 5 年自由现金流有一个大致可信的判断时，这通常是最先使用的估值工具。',
    formula: '内在价值 = Σ[FCFt / (1+WACC)^t] + 终值 / (1+WACC)^n；终值 = FCFn × (1+g) / (WACC-g)。',
    variables: [
      { symbol: 'FCF', meaning: '自由现金流', guidance: '优先用经营现金流减资本开支，最好取正常化水平。' },
      { symbol: 'WACC', meaning: '加权资本成本', guidance: '通常用 7%~11%，高质量成熟公司更低。' },
      { symbol: 'g', meaning: '永续增长率', guidance: '最好低于长期名义 GDP，常用 1%~3%。' },
    ],
    limitations: ['对 WACC 和永续增长率高度敏感。', '不适合利润与现金流高度波动的周期股。'],
    fields: [
      numberField('baseFcf', '基准 FCF', 3800, '以相同币种输入，代表最新年度或正常化 FCF。', { min: 100, max: 10000, step: 100, sensitivity: true }),
      numberField('growthRate', '第一阶段增长率', 10, '未来 5 年的年化 FCF 增长率。', { min: -10, max: 30, unit: '%', sensitivity: true }),
      numberField('years', '高增长年数', 5, '显性预测年数。', { min: 3, max: 10, step: 1 }),
      numberField('terminalGrowthRate', '永续增长率', 2.5, '长期增长率，必须低于 WACC。', { min: 0, max: 4, unit: '%', sensitivity: true }),
      numberField('wacc', 'WACC', 9, '折现率。', { min: 5, max: 15, unit: '%', sensitivity: true }),
      numberField('netCash', '净现金', 1200, '现金减有息负债。', { min: -5000, max: 5000, step: 100 }),
      numberField('sharesOutstanding', '总股数', 900, '与股价口径一致。', { min: 100, max: 5000, step: 10 }),
      numberField('currentPrice', '当前股价', 58, '用于计算上行空间。', { min: 1, max: 500, step: 1 }),
    ],
    sensitivityKeys: ['baseFcf', 'growthRate', 'terminalGrowthRate', 'wacc'],
    compute: computeTwoStageDcf,
  }),
  createTool({
    id: 'dcf-three-stage',
    slug: 'dcf-three-stage',
    category: 'valuation',
    name: '三阶段 DCF 计算器',
    shortName: '三阶段 DCF',
    priority: 'P1',
    tagline: '把高增长衰减过程单独建模。',
    purpose: '适合科技股或新兴市场公司，先经历高增长，再逐步衰减到成熟阶段。',
    scenario: '当你认为未来 5 年之后仍有一段增长下台阶的过渡期，三阶段 DCF 比两阶段更合理。',
    formula: '阶段一保持高增长，阶段二线性衰减至终局增长率，阶段三进入永续增长。',
    variables: [
      { symbol: 'g1', meaning: '高增长率', guidance: '前 5 年的核心增长率。' },
      { symbol: 'g2', meaning: '终局增长率', guidance: '成熟阶段长期增长率，必须低于 WACC。' },
      { symbol: 'WACC', meaning: '折现率', guidance: '与行业风险和资本结构匹配。' },
    ],
    limitations: ['衰减路径属于主观设定。', '对高增长公司的终局竞争格局仍然难以预测。'],
    fields: [
      numberField('baseFcf', '基准 FCF', 2500, '公司当前自由现金流。', { min: 100, max: 10000, step: 100, sensitivity: true }),
      numberField('growthRateHigh', '阶段一增长率', 16, '前 5 年增长率。', { min: 0, max: 40, unit: '%', sensitivity: true }),
      numberField('growthRateTerminal', '终局增长率', 3, '第 10 年后进入的长期增长率。', { min: 0, max: 4, unit: '%', sensitivity: true }),
      numberField('wacc', 'WACC', 10, '折现率。', { min: 5, max: 16, unit: '%', sensitivity: true }),
      numberField('netCash', '净现金', 900, '现金减有息负债。', { min: -3000, max: 5000, step: 100 }),
      numberField('sharesOutstanding', '总股数', 700, '股数。', { min: 100, max: 5000, step: 10 }),
      numberField('currentPrice', '当前股价', 52, '当前市场价格。', { min: 1, max: 500, step: 1 }),
    ],
    sensitivityKeys: ['baseFcf', 'growthRateHigh', 'growthRateTerminal', 'wacc'],
    compute: computeThreeStageDcf,
  }),
  createTool({
    id: 'dcf-reverse',
    slug: 'dcf-reverse',
    category: 'valuation',
    name: '反向 DCF',
    shortName: '反向 DCF',
    priority: 'P0',
    tagline: '把股价翻译成市场预期。',
    purpose: '用当前价格倒推出市场隐含的增长率，适合快速判断价格是否已经透支未来。',
    scenario: '当你已经知道市场价格，但不确定市场在“押注什么”时，反向 DCF 最有价值。',
    formula: '已知当前市值、FCF、WACC 与永续增长率，用二分法求解使 DCF 价格等于现价的增长率。',
    variables: [
      { symbol: 'P', meaning: '当前股价', guidance: '使用当前市场价格。' },
      { symbol: 'g*', meaning: '隐含增长率', guidance: '反推出来的 5 年增长率。' },
      { symbol: 'WACC', meaning: '折现率', guidance: '不要为了让结果好看而过度调低。' },
    ],
    limitations: ['默认把前 5 年增长率视为常数。', '无法替代对商业模式的定性判断。'],
    fields: [
      numberField('currentPrice', '当前股价', 72, '市场价格。', { min: 1, max: 500, step: 1 }),
      numberField('sharesOutstanding', '总股数', 820, '用于从价格换算到权益价值。', { min: 100, max: 5000, step: 10 }),
      numberField('baseFcf', '基准 FCF', 2800, '当前自由现金流。', { min: 100, max: 10000, step: 100 }),
      numberField('wacc', 'WACC', 9.5, '折现率。', { min: 5, max: 15, unit: '%' }),
      numberField('terminalGrowthRate', '永续增长率', 2.5, '长期增长率。', { min: 0, max: 4, unit: '%' }),
      numberField('netCash', '净现金', 500, '净现金调整项。', { min: -3000, max: 5000, step: 100 }),
      numberField('years', '高增长年数', 5, '默认求解 5 年高增长。', { min: 3, max: 10, step: 1 }),
      numberField('expectedGrowthRate', '你的增长预期', 8, '用来和市场隐含增长率对比。', { min: -5, max: 30, unit: '%' }),
    ],
    sensitivityKeys: ['wacc', 'terminalGrowthRate', 'expectedGrowthRate'],
    compute: computeReverseDcf,
  }),
  createTool({
    id: 'dcf-monte-carlo',
    slug: 'dcf-monte-carlo',
    category: 'valuation',
    name: '蒙特卡洛 DCF',
    shortName: '蒙特卡洛 DCF',
    priority: 'P1',
    tagline: '把单点估值变成概率分布。',
    purpose: '通过给增长率和 WACC 设定分布，得到一组可能价格区间，更适合高不确定性公司。',
    scenario: '当你知道估值很依赖假设，但又不想只看一个点估值时，用概率分布更直观。',
    formula: '增长率 ~ N(μ,σ)，WACC ~ N(μ,σ)，重复模拟得到 P10/P50/P90 分布。',
    variables: [
      { symbol: 'μ', meaning: '均值', guidance: '代表你对核心参数的中心判断。' },
      { symbol: 'σ', meaning: '标准差', guidance: '代表你对参数不确定性的宽度判断。' },
      { symbol: 'P50', meaning: '中位数结果', guidance: '比均值更稳健。' },
    ],
    limitations: ['分布设定仍然带有主观性。', '随机模拟无法替代对尾部风险的定性判断。'],
    fields: [
      numberField('baseFcf', '基准 FCF', 2600, '当前自由现金流。', { min: 100, max: 10000, step: 100 }),
      numberField('growthMean', '增长率均值', 11, '未来 5 年增长率中心值。', { min: -5, max: 25, unit: '%' }),
      numberField('growthStd', '增长率波动', 4, '增长率标准差。', { min: 1, max: 15, unit: '%' }),
      numberField('waccMean', 'WACC 均值', 9.5, '折现率中心值。', { min: 5, max: 15, unit: '%' }),
      numberField('waccStd', 'WACC 波动', 1.2, 'WACC 标准差。', { min: 0.5, max: 4, unit: '%' }),
      numberField('terminalGrowthRate', '永续增长率', 2.5, '终局增长率。', { min: 0, max: 4, unit: '%' }),
      numberField('sharesOutstanding', '总股数', 760, '总股数。', { min: 100, max: 5000, step: 10 }),
      numberField('netCash', '净现金', 300, '净现金。', { min: -3000, max: 5000, step: 100 }),
      numberField('currentPrice', '当前股价', 56, '市场股价。', { min: 1, max: 500, step: 1 }),
      numberField('iterations', '模拟次数', 5000, '次数越高，分布越平滑。', { min: 1000, max: 10000, step: 500 }),
    ],
    sensitivityKeys: ['growthMean', 'growthStd', 'waccMean', 'waccStd'],
    compute: computeMonteCarloDcf,
  }),
  createTool({
    id: 'graham-original',
    slug: 'graham-original',
    category: 'valuation',
    name: 'Graham 原始安全边际计算器',
    shortName: 'Graham 原始',
    priority: 'P0',
    tagline: '经典价值投资的极简估值锚。',
    purpose: '适合盈利稳定、账面价值有意义的传统价值股。',
    scenario: '如果你想快速粗估一个传统行业公司的合理价格，这是最低成本的第一步。',
    formula: '内在价值 = √(22.5 × EPS × BVPS)。',
    variables: [
      { symbol: 'EPS', meaning: '每股收益', guidance: '最好用正常化 EPS。' },
      { symbol: 'BVPS', meaning: '每股净资产', guidance: '对金融股与资产密集型行业更有意义。' },
    ],
    limitations: ['不适用于无盈利或高 P/B 成长股。', '账面价值对轻资产公司参考性弱。'],
    fields: [
      numberField('eps', 'EPS', 4.8, '每股收益。', { min: 0.1, max: 20, step: 0.1 }),
      numberField('bvps', 'BVPS', 18.5, '每股净资产。', { min: 1, max: 100, step: 0.5 }),
      numberField('currentPrice', '当前股价', 31, '当前市场价格。', { min: 1, max: 500, step: 1 }),
    ],
    sensitivityKeys: ['eps', 'bvps'],
    compute: computeGrahamOriginal,
  }),
  createTool({
    id: 'graham-revised',
    slug: 'graham-revised',
    category: 'valuation',
    name: 'Graham Revised 安全边际计算器',
    shortName: 'Graham Revised',
    priority: 'P0',
    tagline: '把利率环境和行业风险拉回估值。',
    purpose: '替代旧 Graham 公式，把利率变化和行业风险差异纳入公允 PE。',
    scenario: '适合在利率波动时期，用更现实的折价框架看稳定盈利公司。',
    formula: '内在价值 = EPS × ((8.5 + 2g) × (4.4 / RF)) × RiskFactor。',
    variables: [
      { symbol: 'g', meaning: '预期增长率', guidance: '通常用中期盈利增长率。' },
      { symbol: 'RF', meaning: '无风险利率代理', guidance: '取 AAA 公司债或长期国债中更高者。' },
      { symbol: 'RiskFactor', meaning: '风险修正系数', guidance: '稳定公司更高，周期或高波动公司更低。' },
    ],
    limitations: ['增长率和风险系数都带有主观判断。', '不适合高研发、低当前盈利公司。'],
    fields: [
      numberField('eps', 'EPS', 4.2, '每股收益。', { min: 0.1, max: 20, step: 0.1 }),
      numberField('growthRate', '预期增长率', 8, '中期盈利增长率。', { min: -5, max: 25, unit: '%' }),
      numberField('aaaYield', 'AAA 公司债收益率', 4.8, '优先用当前市场收益率。', { min: 1, max: 10, unit: '%' }),
      numberField('treasuryYield', '长期国债收益率', 4.1, '长期国债收益率。', { min: 1, max: 10, unit: '%' }),
      selectField('riskFactor', '风险等级', '1.0', '按商业稳定性调整公允 PE。', [
        { label: '极稳定 1.1', value: '1.1' },
        { label: '普通 1.0', value: '1.0' },
        { label: '周期 0.8', value: '0.8' },
        { label: '高波动 0.6', value: '0.6' },
      ]),
      numberField('currentPrice', '当前股价', 36, '当前价格。', { min: 1, max: 500, step: 1 }),
    ],
    sensitivityKeys: ['growthRate', 'aaaYield', 'treasuryYield'],
    compute: computeGrahamRevised,
  }),
  createTool({
    id: 'owner-earnings',
    slug: 'owner-earnings',
    category: 'valuation',
    name: 'Owner Earnings 计算器',
    shortName: 'Owner Earnings',
    priority: 'P2',
    tagline: '从股东可得现金出发，而不是账面利润。',
    purpose: '用 Buffett 视角估算企业真实可分配现金。',
    scenario: '适合在资本开支较大的公司里，检查净利润是否真的能变成股东现金。',
    formula: 'Owner Earnings = 净利润 + D&A - 维持性资本支出 - 营运资本变化。',
    variables: [
      { symbol: 'D&A', meaning: '折旧与摊销', guidance: '可从现金流量表取得。' },
      { symbol: '维持性资本支出', meaning: '维持当前产能所需 Capex', guidance: '可用总 Capex 乘维持性比例估算。' },
    ],
    limitations: ['维持性资本支出没有统一口径。', '营运资本季节性变化会干扰单年结果。'],
    fields: [
      numberField('netIncome', '净利润', 1850, '归母净利润。', { min: 100, max: 10000, step: 50 }),
      numberField('depreciation', '折旧摊销', 520, '折旧与摊销。', { min: 0, max: 5000, step: 10 }),
      numberField('totalCapex', '总资本支出', 900, '当期总 Capex。', { min: 0, max: 5000, step: 50 }),
      numberField('maintenanceRatio', '维持性 Capex 占比', 60, '用百分比估算维持性支出。', { min: 10, max: 100, unit: '%' }),
      numberField('workingCapitalChange', '营运资本变化', 120, '正值代表现金被占用。', { min: -1000, max: 1000, step: 20 }),
      numberField('sharesOutstanding', '总股数', 900, '总股数。', { min: 100, max: 5000, step: 10 }),
      numberField('currentPrice', '当前股价', 29, '市场价格。', { min: 1, max: 500, step: 1 }),
    ],
    sensitivityKeys: ['maintenanceRatio', 'workingCapitalChange'],
    compute: computeOwnerEarnings,
  }),
  createTool({
    id: 'ddm',
    slug: 'ddm',
    category: 'valuation',
    name: '股息折现模型',
    shortName: 'DDM',
    priority: 'P2',
    tagline: '为高分红成熟公司建立专用估值锚。',
    purpose: '适合银行、公用事业、REITs 等股息政策稳定的企业。',
    scenario: '当估值核心来自股东现金分配而不是再投资时，DDM 比 DCF 更直接。',
    formula: 'V = Σ[Dt/(1+r)^t] + 终值 / (1+r)^n。',
    variables: [
      { symbol: 'D1', meaning: '下一期股息', guidance: '用当前股息乘增长率估算。' },
      { symbol: 'r', meaning: '要求回报率', guidance: '应高于永续增长率。' },
      { symbol: 'g', meaning: '永续增长率', guidance: '通常取 1%~3%。' },
    ],
    limitations: ['不适合分红不稳定或高再投资公司。', '要求回报率稍变动，结果就会明显变化。'],
    fields: [
      numberField('currentDividend', '当前股息', 2.4, '当前每股年度股息。', { min: 0.1, max: 20, step: 0.1, sensitivity: true }),
      numberField('shortGrowthRate', '短期增长率', 6, '未来几年股息增长率。', { min: 0, max: 20, unit: '%', sensitivity: true }),
      numberField('years', '高增长年数', 5, '短期高增长阶段年数。', { min: 3, max: 10, step: 1 }),
      numberField('perpetualGrowthRate', '永续增长率', 2, '长期股息增长率。', { min: 0, max: 4, unit: '%', sensitivity: true }),
      numberField('requiredReturn', '要求回报率', 8.5, '投资人要求回报率。', { min: 5, max: 15, unit: '%', sensitivity: true }),
      numberField('currentPrice', '当前股价', 42, '当前市场价格。', { min: 1, max: 500, step: 1 }),
    ],
    sensitivityKeys: ['currentDividend', 'shortGrowthRate', 'perpetualGrowthRate', 'requiredReturn'],
    compute: computeDdm,
  }),
  createTool({
    id: 'multiples',
    slug: 'multiples',
    category: 'valuation',
    name: '相对估值对比器',
    shortName: '相对估值',
    priority: 'P0',
    tagline: '横向对比同行，判断贵贱位置。',
    purpose: '用多组倍数和同行中位数对比，快速判断当前估值处于行业什么位置。',
    scenario: '适合竞争格局清晰、可比公司较多的行业。',
    formula: '估值偏离 = 目标倍数 / 同行中位数 - 1。',
    variables: [
      { symbol: 'PE', meaning: '市盈率', guidance: '适合盈利稳定公司。' },
      { symbol: 'EV/EBITDA', meaning: '企业价值倍数', guidance: '适合资本结构不同的公司横向比较。' },
      { symbol: 'Price/OE', meaning: '股东现金倍数', guidance: '适合配合 Owner Earnings 一起看。' },
    ],
    limitations: ['同行本身估值可能整体偏高或偏低。', '成长、护城河与资本配置差异无法完全通过倍数体现。'],
    fields: [
      numberField('targetPe', '目标公司 PE', 18, '目标公司 PE。', { min: 1, max: 60, step: 0.5 }),
      seriesField('peersPe', '同行 PE', '21, 24, 19, 22', '最多 4 家同行，逗号分隔。'),
      numberField('targetPfcf', '目标公司 P/FCF', 15, '目标公司 P/FCF。', { min: 1, max: 50, step: 0.5 }),
      seriesField('peersPfcf', '同行 P/FCF', '18, 17, 16, 19', '同行 P/FCF。'),
      numberField('targetPb', '目标公司 PB', 2.1, '目标公司 PB。', { min: 0.2, max: 15, step: 0.1 }),
      seriesField('peersPb', '同行 PB', '2.8, 3.1, 2.5, 2.9', '同行 PB。'),
      numberField('targetPs', '目标公司 PS', 4.2, '目标公司 PS。', { min: 0.2, max: 25, step: 0.1 }),
      seriesField('peersPs', '同行 PS', '5.1, 4.8, 5.6, 5.0', '同行 PS。'),
      numberField('targetEvEbitda', '目标公司 EV/EBITDA', 12, '目标公司 EV/EBITDA。', { min: 1, max: 40, step: 0.5 }),
      seriesField('peersEvEbitda', '同行 EV/EBITDA', '14, 15, 13, 16', '同行 EV/EBITDA。'),
      numberField('targetEvEbit', '目标公司 EV/EBIT', 16, '目标公司 EV/EBIT。', { min: 1, max: 40, step: 0.5 }),
      seriesField('peersEvEbit', '同行 EV/EBIT', '18, 19, 17, 20', '同行 EV/EBIT。'),
      numberField('targetEvNopat', '目标公司 EV/NOPAT', 18, '目标公司 EV/NOPAT。', { min: 1, max: 40, step: 0.5 }),
      seriesField('peersEvNopat', '同行 EV/NOPAT', '20, 23, 21, 22', '同行 EV/NOPAT。'),
      numberField('targetPriceOe', '目标公司 Price/OE', 17, '目标公司 Price/OE。', { min: 1, max: 40, step: 0.5 }),
      seriesField('peersPriceOe', '同行 Price/OE', '20, 18, 19, 21', '同行 Price/OE。'),
    ],
    sensitivityKeys: ['targetPe', 'targetPfcf', 'targetEvEbitda', 'targetPriceOe'],
    compute: computeMultiples,
  }),
  createTool({
    id: 'valuation-bands',
    slug: 'valuation-bands',
    category: 'valuation',
    name: 'Historical Valuation Bands',
    shortName: '历史估值带',
    priority: 'P1',
    tagline: '看当前估值在自己历史里处于哪里。',
    purpose: '通过过去 10 年的估值倍数，判断当前估值相对自身历史的分位位置。',
    scenario: '适合商业模式已经成熟、历史估值区间较稳定的公司。',
    formula: '当前分位数 = 历史样本中小于等于当前倍数的比例。',
    variables: [
      { symbol: '历史序列', meaning: '过去 10 年的倍数', guidance: '最好统一使用同一个口径，例如滚动 PE 或 EV/EBITDA。' },
      { symbol: '当前倍数', meaning: '市场实时估值', guidance: '与历史序列同口径。' },
    ],
    limitations: ['历史倍数受利率周期影响明显。', '公司商业模式变化后，历史区间可能失效。'],
    fields: [
      selectField('metricLabel', '估值口径', 'PE', '选择你正在观察的历史倍数口径。', [
        { label: 'PE', value: 'PE' },
        { label: 'P/FCF', value: 'P/FCF' },
        { label: 'EV/EBITDA', value: 'EV/EBITDA' },
        { label: 'PB', value: 'PB' },
      ]),
      seriesField('historySeries', '历史 10 年倍数', '15, 16, 18, 21, 22, 20, 19, 17, 16, 18', '从最早到最近输入 10 年倍数。'),
      numberField('currentMultiple', '当前倍数', 17.5, '当前市场倍数。', { min: 1, max: 60, step: 0.1 }),
    ],
    sensitivityKeys: ['currentMultiple'],
    compute: computeValuationBands,
  }),
  createTool({
    id: 'expected-return',
    slug: 'expected-return',
    category: 'valuation',
    name: 'Expected Return Calculator',
    shortName: '预期回报',
    priority: 'P2',
    tagline: '把未来回报拆成几个可验证来源。',
    purpose: '估算持有期预期年化回报，并区分收益到底来自现金、增长还是估值变化。',
    scenario: '特别适合持有前做收益来源拆解，而不是只盯目标价。',
    formula: '预期 CAGR ≈ FCF Yield + 增长率 + 回购收益率 + 估值变化率。',
    variables: [
      { symbol: 'FCF Yield', meaning: '自由现金流收益率', guidance: '当前 FCF 相对市值的回报。' },
      { symbol: '回购收益率', meaning: '股份减少贡献', guidance: '可近似用股份数下降速度。' },
    ],
    limitations: ['公式是近似拆解，不是精确预测。', '估值变化项最不稳定。'],
    fields: [
      numberField('fcfYield', 'FCF Yield', 5.5, '当前自由现金流收益率。', { min: 0, max: 20, unit: '%' }),
      numberField('growthRate', '增长率', 8, '未来几年经营增长率。', { min: -5, max: 25, unit: '%' }),
      numberField('buybackYield', '回购收益率', 2, '股份数下降带来的每股收益。', { min: -5, max: 10, unit: '%' }),
      numberField('reratingChange', '估值变化率', 1, '退出倍数变化贡献。', { min: -10, max: 10, unit: '%' }),
    ],
    sensitivityKeys: ['growthRate', 'reratingChange'],
    compute: computeExpectedReturn,
  }),
  createTool({
    id: 'magic-formula',
    slug: 'magic-formula',
    category: 'valuation',
    name: 'Magic Formula 计算器',
    shortName: 'Magic Formula',
    priority: 'P2',
    tagline: '用便宜和高回报双因子筛公司。',
    purpose: 'Greenblatt 的经典双因子思路：企业既要便宜，也要有高资本回报。',
    scenario: '适合做筛选器或作为估值清单中的第一道排序。',
    formula: 'Earnings Yield = EBIT / EV；ROC = EBIT / (净营运资本 + 净固定资产)。',
    variables: [
      { symbol: 'EV', meaning: '企业价值', guidance: '市值 + 净债务。' },
      { symbol: 'ROC', meaning: '资本回报率', guidance: '越高越好。' },
    ],
    limitations: ['单家公司难以得到真正的“排名”，这里用组合分数代替。', '周期行业 EBIT 需要正常化。'],
    fields: [
      numberField('ebit', 'EBIT', 1350, '息税前利润。', { min: 100, max: 10000, step: 50 }),
      numberField('enterpriseValue', 'EV', 18500, '企业价值。', { min: 1000, max: 100000, step: 500 }),
      numberField('netWorkingCapital', '净营运资本', 2400, '流动经营资产减负债。', { min: 100, max: 20000, step: 100 }),
      numberField('netFixedAssets', '净固定资产', 3600, '经营性固定资产净额。', { min: 100, max: 50000, step: 100 }),
    ],
    sensitivityKeys: ['ebit', 'enterpriseValue'],
    compute: computeMagicFormula,
  }),
  createTool({
    id: 'acquirers-multiple',
    slug: 'acquirers-multiple',
    category: 'valuation',
    name: 'Acquirer\'s Multiple 计算器',
    shortName: 'Acquirer\'s Multiple',
    priority: 'P3',
    tagline: '从收购者视角看便宜程度。',
    purpose: '使用 EV / 经营性 EBIT 判断一家企业是否具有深度价值属性。',
    scenario: '尤其适合资产负债结构复杂、净债务变化较大的公司。',
    formula: 'Acquirer\'s Multiple = EV / 经营性 EBIT。',
    variables: [
      { symbol: 'EV', meaning: '企业价值', guidance: '收购者需要支付的总代价。' },
      { symbol: '经营性 EBIT', meaning: '剔除非经常项目后的经营利润', guidance: '尽量使用正常化数据。' },
    ],
    limitations: ['不考虑资本开支需求。', '景气高点利润会让倍数看起来过低。'],
    fields: [
      numberField('enterpriseValue', 'EV', 12000, '企业价值。', { min: 1000, max: 100000, step: 500 }),
      numberField('operatingEbit', '经营性 EBIT', 1600, '经营性 EBIT。', { min: 100, max: 10000, step: 50 }),
      seriesField('peerMultiples', '同行倍数', '9, 11, 10, 12', '同行 Acquirer\'s Multiple，逗号分隔。'),
    ],
    sensitivityKeys: ['enterpriseValue', 'operatingEbit'],
    compute: computeAcquirersMultiple,
  }),
  createTool({
    id: 'f-score',
    slug: 'f-score',
    category: 'health',
    name: 'Piotroski F-Score',
    shortName: 'F-Score',
    priority: 'P0',
    tagline: '先过滤价值陷阱，再谈估值。',
    purpose: '通过 9 个二元因子检查便宜公司是否真的在改善。',
    scenario: '适合做“便宜但不烂”的第一层筛选。',
    formula: '九项因子通过 1 分，不通过 0 分，合计 0~9 分。',
    variables: [
      { symbol: 'ROA', meaning: '资产回报率', guidance: '用当前年和上一年对比。' },
      { symbol: 'CFO', meaning: '经营现金流', guidance: '要求为正，且最好高于净利润。' },
    ],
    limitations: ['只是一年与上一年的对比，不能替代完整财务分析。', '金融行业应用时要谨慎。'],
    fields: [
      numberField('roaCurrent', '当前 ROA', 8, '当前 ROA。', { min: -20, max: 30, unit: '%' }),
      numberField('roaPrior', '上一年 ROA', 6.2, '上一年 ROA。', { min: -20, max: 30, unit: '%' }),
      numberField('cfo', '经营现金流', 2100, '经营现金流。', { min: -5000, max: 10000, step: 100 }),
      numberField('netIncome', '净利润', 1750, '净利润。', { min: -5000, max: 10000, step: 100 }),
      numberField('leverageCurrent', '当前杠杆率', 0.48, '总债务 / 总资产或长期债务 / 总资产。', { min: 0, max: 2, step: 0.01 }),
      numberField('leveragePrior', '上一年杠杆率', 0.55, '上一年杠杆率。', { min: 0, max: 2, step: 0.01 }),
      numberField('currentRatioCurrent', '当前流动比率', 1.6, '当前流动比率。', { min: 0, max: 5, step: 0.05 }),
      numberField('currentRatioPrior', '上一年流动比率', 1.4, '上一年流动比率。', { min: 0, max: 5, step: 0.05 }),
      numberField('sharesCurrent', '当前股数', 900, '当前总股数。', { min: 100, max: 5000, step: 10 }),
      numberField('sharesPrior', '上一年股数', 915, '上一年总股数。', { min: 100, max: 5000, step: 10 }),
      numberField('grossMarginCurrent', '当前毛利率', 44, '当前毛利率。', { min: 0, max: 100, unit: '%' }),
      numberField('grossMarginPrior', '上一年毛利率', 41, '上一年毛利率。', { min: 0, max: 100, unit: '%' }),
      numberField('assetTurnoverCurrent', '当前资产周转率', 0.82, '当前资产周转率。', { min: 0, max: 3, step: 0.01 }),
      numberField('assetTurnoverPrior', '上一年资产周转率', 0.76, '上一年资产周转率。', { min: 0, max: 3, step: 0.01 }),
    ],
    sensitivityKeys: ['roaCurrent', 'cfo', 'grossMarginCurrent', 'assetTurnoverCurrent'],
    compute: computePiotroski,
  }),
  createTool({
    id: 'z-score',
    slug: 'z-score',
    category: 'health',
    name: 'Altman Z-Score',
    shortName: 'Z-Score',
    priority: 'P2',
    tagline: '先看会不会出事，再看值不值钱。',
    purpose: '识别破产风险和财务安全边界。',
    scenario: '在债务压力较大的制造业或传统行业公司上尤其有用。',
    formula: 'Z = 1.2X1 + 1.4X2 + 3.3X3 + 0.6X4 + 1.0X5。',
    variables: [
      { symbol: 'X1', meaning: '营运资金 / 总资产', guidance: '衡量短期缓冲。' },
      { symbol: 'X4', meaning: '市值 / 总负债', guidance: '衡量资本市场缓冲。' },
    ],
    limitations: ['制造业版本对平台型公司适配性有限。', '市场情绪极端时，X4 也会被拉大或压缩。'],
    fields: [
      numberField('workingCapital', '营运资金', 1800, '流动资产减流动负债。', { min: -5000, max: 10000, step: 100 }),
      numberField('retainedEarnings', '留存收益', 5200, '累计留存收益。', { min: -5000, max: 20000, step: 100 }),
      numberField('ebit', 'EBIT', 1500, '息税前利润。', { min: -5000, max: 10000, step: 100 }),
      numberField('marketValueEquity', '市值', 15000, '股权市值。', { min: 1000, max: 100000, step: 500 }),
      numberField('totalLiabilities', '总负债', 6800, '总负债。', { min: 100, max: 100000, step: 100 }),
      numberField('sales', '营收', 14500, '营收。', { min: 1000, max: 100000, step: 500 }),
      numberField('totalAssets', '总资产', 21000, '总资产。', { min: 1000, max: 200000, step: 500 }),
    ],
    sensitivityKeys: ['ebit', 'marketValueEquity', 'totalLiabilities'],
    compute: computeAltman,
  }),
  createTool({
    id: 'dupont',
    slug: 'dupont',
    category: 'health',
    name: '杜邦分析',
    shortName: '杜邦分析',
    priority: 'P1',
    tagline: '高 ROE 究竟是质量还是杠杆。',
    purpose: '把 ROE 拆成利润率、周转率和杠杆三个或五个因子。',
    scenario: '适合在比较两家公司“ROE 都很高”但质量不同的时候使用。',
    formula: 'ROE = 净利率 × 资产周转率 × 权益乘数；五因子加入税负与利息负担。',
    variables: [
      { symbol: '净利率', meaning: '利润率', guidance: '更高通常意味着定价力更强。' },
      { symbol: '权益乘数', meaning: '杠杆', guidance: '过高会放大风险。' },
    ],
    limitations: ['单年数据容易受一次性项目影响。', '需要和行业特性一起解读。'],
    fields: [
      numberField('revenue', '营收', 16000, '营业收入。', { min: 1000, max: 100000, step: 500 }),
      numberField('netIncome', '净利润', 2200, '净利润。', { min: -5000, max: 10000, step: 100 }),
      numberField('averageAssets', '平均总资产', 19000, '平均总资产。', { min: 1000, max: 200000, step: 500 }),
      numberField('averageEquity', '平均权益', 8600, '平均股东权益。', { min: 1000, max: 100000, step: 500 }),
      numberField('ebit', 'EBIT', 3100, 'EBIT。', { min: -5000, max: 10000, step: 100 }),
      numberField('pretaxIncome', '税前利润', 2700, '税前利润。', { min: -5000, max: 10000, step: 100 }),
    ],
    sensitivityKeys: ['netIncome', 'revenue', 'averageAssets', 'averageEquity'],
    compute: computeDupont,
  }),
  createTool({
    id: 'roic-wacc',
    slug: 'roic-wacc',
    category: 'health',
    name: 'ROIC vs WACC 分析器',
    shortName: 'ROIC vs WACC',
    priority: 'P0',
    tagline: '判断企业是否真的在创造价值。',
    purpose: '比较资本回报率与资本成本，直接观察企业是创造价值还是消耗资本。',
    scenario: '适合作为“护城河”与资本配置能力的定量检查。',
    formula: 'ROIC = NOPAT / 投入资本；经济利润 = (ROIC - WACC) × 投入资本。',
    variables: [
      { symbol: 'NOPAT', meaning: '税后经营利润', guidance: 'EBIT × (1-T)。' },
      { symbol: '投入资本', meaning: '权益 + 债务 - 现金', guidance: '尽量用经营口径。' },
    ],
    limitations: ['行业周期会使单年 ROIC 偏高或偏低。', '资本化研发等口径差异会影响比较结果。'],
    fields: [
      numberField('ebit', 'EBIT', 2600, '息税前利润。', { min: 100, max: 10000, step: 50 }),
      numberField('taxRate', '税率', 22, '有效税率。', { min: 0, max: 40, unit: '%' }),
      numberField('equityValue', '权益价值', 18000, '股权价值。', { min: 1000, max: 200000, step: 500 }),
      numberField('debtValue', '债务价值', 4500, '有息债务。', { min: 0, max: 100000, step: 100 }),
      numberField('cash', '现金', 2200, '现金及等价物。', { min: 0, max: 100000, step: 100 }),
      numberField('riskFreeRate', '无风险利率', 4.2, 'Rf。', { min: 1, max: 10, unit: '%' }),
      numberField('beta', 'Beta', 1.05, '股票 Beta。', { min: 0.2, max: 2.5, step: 0.05 }),
      numberField('equityRiskPremium', '股权风险溢价', 5.5, 'ERP。', { min: 2, max: 10, unit: '%' }),
      numberField('interestExpense', '利息费用', 240, '年度利息费用。', { min: 0, max: 5000, step: 10 }),
      numberField('averageDebt', '平均债务', 4200, '平均有息债务。', { min: 100, max: 100000, step: 100 }),
    ],
    sensitivityKeys: ['ebit', 'taxRate', 'beta', 'equityRiskPremium'],
    compute: computeRoicWacc,
  }),
  createTool({
    id: 'fcf-quality',
    slug: 'fcf-quality',
    category: 'health',
    name: 'FCF 质量分析器',
    shortName: 'FCF 质量',
    priority: 'P1',
    tagline: '利润能否真正落到现金流。',
    purpose: '检查利润与自由现金流之间的质量差异。',
    scenario: '在利润看起来不错、但总觉得“钱没出来”的公司上特别重要。',
    formula: 'FCF 转化率 = FCF / 净利润；Sloan Ratio = (净利润 - FCF) / 总资产。',
    variables: [
      { symbol: 'FCF', meaning: '自由现金流', guidance: '经营现金流减资本开支。' },
      { symbol: 'CCC', meaning: '现金循环周期', guidance: '越短通常越好。' },
    ],
    limitations: ['单年 Capex 与营运资本波动会干扰判断。', '成长型公司需要结合扩张周期一起看。'],
    fields: [
      numberField('netIncome', '净利润', 1600, '净利润。', { min: -5000, max: 10000, step: 100 }),
      numberField('operatingCashFlow', '经营现金流', 1900, '经营现金流。', { min: -5000, max: 10000, step: 100 }),
      numberField('capitalExpenditure', '资本开支', 450, '资本开支。', { min: 0, max: 5000, step: 20 }),
      numberField('totalAssets', '总资产', 15000, '总资产。', { min: 1000, max: 200000, step: 500 }),
      numberField('receivableDays', '应收账款天数', 38, 'DSO。', { min: 0, max: 180, step: 1 }),
      numberField('inventoryDays', '存货天数', 52, 'DIO。', { min: 0, max: 365, step: 1 }),
      numberField('payableDays', '应付账款天数', 43, 'DPO。', { min: 0, max: 365, step: 1 }),
    ],
    sensitivityKeys: ['operatingCashFlow', 'capitalExpenditure', 'receivableDays', 'inventoryDays'],
    compute: computeFcfQuality,
  }),
  createTool({
    id: 'debt-health',
    slug: 'debt-health',
    category: 'health',
    name: '债务健康度分析器',
    shortName: '债务健康度',
    priority: 'P1',
    tagline: '先确认债务不会把好公司变坏。',
    purpose: '从杠杆、利息保障和流动性三个角度评估债务安全。',
    scenario: '尤其适合利率上行环境或资产负债表承压行业。',
    formula: '核心指标包括净债务/EBITDA、利息覆盖率、流动比率、速动比率、债务/权益。',
    variables: [
      { symbol: '净债务/EBITDA', meaning: '杠杆强度', guidance: '通常越低越安全。' },
      { symbol: '利息覆盖率', meaning: '偿息能力', guidance: '通常高于 5 倍更稳健。' },
    ],
    limitations: ['行业资产结构不同，绝对阈值不能机械照搬。', '金融企业不适用这套口径。'],
    fields: [
      numberField('netDebt', '净债务', 3200, '净债务。', { min: -5000, max: 100000, step: 100 }),
      numberField('ebitda', 'EBITDA', 2100, 'EBITDA。', { min: 100, max: 10000, step: 50 }),
      numberField('ebit', 'EBIT', 1680, 'EBIT。', { min: 100, max: 10000, step: 50 }),
      numberField('interestExpense', '利息费用', 180, '年度利息费用。', { min: 1, max: 5000, step: 5 }),
      numberField('currentAssets', '流动资产', 4100, '流动资产。', { min: 100, max: 50000, step: 100 }),
      numberField('currentLiabilities', '流动负债', 2500, '流动负债。', { min: 100, max: 50000, step: 100 }),
      numberField('inventory', '存货', 900, '存货。', { min: 0, max: 20000, step: 50 }),
      numberField('totalDebt', '总债务', 3800, '总债务。', { min: 0, max: 100000, step: 100 }),
      numberField('totalEquity', '股东权益', 7600, '股东权益。', { min: 100, max: 100000, step: 100 }),
    ],
    sensitivityKeys: ['netDebt', 'ebitda', 'interestExpense', 'currentLiabilities'],
    compute: computeDebtHealth,
  }),
  createTool({
    id: 'capital-allocation',
    slug: 'capital-allocation',
    category: 'health',
    name: 'Capital Allocation Analyzer',
    shortName: '资本配置',
    priority: 'P1',
    tagline: '看管理层有没有把现金变成每股价值。',
    purpose: '综合 ROIC、回购、分红与每股 FCF 增长，评价管理层资本配置能力。',
    scenario: '适合成熟公司和现金流较稳定的行业。',
    formula: '用 ROIC 趋势、股份数变化、股息增长和 FCF/股 CAGR 综合评分。',
    variables: [
      { symbol: 'ROIC', meaning: '资本回报率', guidance: '平均水平越高越好。' },
      { symbol: '股份数趋势', meaning: '回购或稀释', guidance: '下降通常更友好。' },
    ],
    limitations: ['回购是否高质量还要看回购价格。', '分红和回购要结合行业成熟度判断。'],
    fields: [
      seriesField('roicSeries', 'ROIC 序列', '12, 13, 14, 15, 16', '最近 5 年 ROIC，用百分比。'),
      seriesField('sharesSeries', '股数序列', '1000, 990, 975, 960, 945', '最近 5 年总股数。'),
      seriesField('dividendsSeries', '股息/股序列', '1.2, 1.3, 1.4, 1.55, 1.7', '最近 5 年每股股息。'),
      seriesField('fcfPerShareSeries', 'FCF/股序列', '2.1, 2.4, 2.7, 3.0, 3.4', '最近 5 年每股 FCF。'),
    ],
    sensitivityKeys: [],
    compute: computeCapitalAllocation,
  }),
  createTool({
    id: 'dilution-analyzer',
    slug: 'dilution-analyzer',
    category: 'health',
    name: 'Share Dilution Analyzer',
    shortName: '股权稀释',
    priority: 'P2',
    tagline: '收入增长不代表每股价值增长。',
    purpose: '用股本扩张速度和每股指标增速，评估稀释是否在吞噬股东回报。',
    scenario: '尤其适合高股权激励、频繁增发的科技公司。',
    formula: '稀释 CAGR、营收/股 CAGR、FCF/股 CAGR 与 SBC/营收组合评估。',
    variables: [
      { symbol: 'SBC / 营收', meaning: '股权激励强度', guidance: '越高越容易吞噬股东回报。' },
      { symbol: '每股指标 CAGR', meaning: '营收/股或 FCF/股增速', guidance: '最终看每股而不是总量。' },
    ],
    limitations: ['成长公司短期稀释并非一定坏事。', '需要和经营增长质量一起看。'],
    fields: [
      seriesField('sharesSeries', '股数序列', '1000, 1030, 1060, 1095, 1120', '最近 5 年总股数。'),
      seriesField('revenueSeries', '营收序列', '4200, 5000, 5900, 6800, 7700', '最近 5 年营收。'),
      seriesField('fcfSeries', 'FCF 序列', '320, 410, 530, 660, 820', '最近 5 年 FCF。'),
      numberField('sbcToRevenue', 'SBC / 营收', 6, '股权激励占营收比例。', { min: 0, max: 30, unit: '%' }),
    ],
    sensitivityKeys: ['sbcToRevenue'],
    compute: computeDilution,
  }),
  createTool({
    id: 'cagr',
    slug: 'cagr',
    category: 'growth',
    name: 'CAGR & 再投资率分析器',
    shortName: 'CAGR & 再投资率',
    priority: 'P0',
    tagline: '增长和再投资效率要一起看。',
    purpose: '比较营收、FCF、EPS 的历史增速，并用再投资率判断增长是否可持续。',
    scenario: '适合评估一家公司“长得快”背后是否真的有资本回报支撑。',
    formula: 'CAGR = (终值/初值)^(1/n)-1；可持续增长率 = ROIC × 再投资率。',
    variables: [
      { symbol: '再投资率', meaning: '(净 Capex + ΔNWC) / NOPAT', guidance: '反映利润中有多少继续投入经营。' },
      { symbol: '可持续增长率', meaning: 'ROIC × 再投资率', guidance: '用来和实际增长率对比。' },
    ],
    limitations: ['历史 CAGR 不代表未来。', '再投资率最好使用正常化数据而不是单一年份。'],
    fields: [
      seriesField('revenueSeries', '营收序列', '8000, 8900, 9800, 10850, 11900', '最近 5 年营收。'),
      seriesField('fcfSeries', 'FCF 序列', '780, 860, 980, 1120, 1280', '最近 5 年 FCF。'),
      seriesField('epsSeries', 'EPS 序列', '2.4, 2.7, 3.0, 3.3, 3.7', '最近 5 年 EPS。'),
      numberField('nopat', 'NOPAT', 2100, '最近一年税后经营利润。', { min: 100, max: 10000, step: 50 }),
      numberField('netCapex', '净 Capex', 520, '扩张与维持性 Capex 净额。', { min: -1000, max: 5000, step: 20 }),
      numberField('workingCapitalChange', '营运资本变化', 180, 'ΔNWC。', { min: -1000, max: 1000, step: 20 }),
      numberField('roic', 'ROIC', 15, 'ROIC，用百分比。', { min: 0, max: 40, unit: '%' }),
    ],
    sensitivityKeys: ['netCapex', 'workingCapitalChange', 'roic'],
    compute: computeCagrReinvestment,
  }),
  createTool({
    id: 'gross-margin',
    slug: 'gross-margin',
    category: 'growth',
    name: '毛利率趋势分析器',
    shortName: '毛利率趋势',
    priority: 'P2',
    tagline: '护城河经常先体现在毛利率。',
    purpose: '比较自身 5 年毛利率趋势和同行基准，观察定价力是否在改善。',
    scenario: '适合产品型公司或竞争格局较稳定的行业。',
    formula: '以年度毛利率序列和同行序列做趋势与差值分析。',
    variables: [
      { symbol: '毛利率趋势', meaning: '公司自身变化', guidance: '持续上升通常更好。' },
      { symbol: '同行差值', meaning: '与行业对比', guidance: '高于同行更能说明护城河。' },
    ],
    limitations: ['原材料和汇率波动也会影响毛利率。', '服务型和平台型公司需要结合业务结构解读。'],
    fields: [
      seriesField('companyMargins', '公司毛利率', '42, 43, 44, 45, 46', '最近 5 年公司毛利率，用百分比。'),
      seriesField('peerMargins', '同行毛利率', '38, 39, 39.5, 40, 40.5', '最近 5 年同行中位毛利率。'),
    ],
    sensitivityKeys: [],
    compute: computeGrossMarginTrend,
  }),
  createTool({
    id: 'rule-of-40',
    slug: 'rule-of-40',
    category: 'growth',
    name: 'Rule of 40 计算器',
    shortName: 'Rule of 40',
    priority: 'P3',
    tagline: 'SaaS 公司增长与现金流的平衡尺。',
    purpose: '适合 SaaS 和科技公司，衡量“增长速度 + FCF 利润率”是否达到健康区间。',
    scenario: '当公司仍处于扩张阶段，传统 PE 指标意义不大时尤其有用。',
    formula: 'Rule of 40 = 营收增长率 + FCF 利润率。',
    variables: [
      { symbol: '营收增长率', meaning: '扩张速度', guidance: '通常看同比或年化增速。' },
      { symbol: 'FCF 利润率', meaning: '现金流质量', guidance: '越高越说明增长更健康。' },
    ],
    limitations: ['不适合成熟低增长公司。', '一次性费用或收入会影响 FCF 利润率。'],
    fields: [
      seriesField('growthSeries', '营收增长率', '32, 29, 27, 24, 22', '最近 5 年营收增长率，用百分比。'),
      seriesField('fcfMarginSeries', 'FCF 利润率', '4, 7, 10, 13, 16', '最近 5 年 FCF 利润率，用百分比。'),
    ],
    sensitivityKeys: [],
    compute: computeRuleOf40,
  }),
  createTool({
    id: 'peg',
    slug: 'peg',
    category: 'growth',
    name: 'PEG 比率计算器',
    shortName: 'PEG',
    priority: 'P3',
    tagline: '用增长去修正 PE。',
    purpose: '用 Peter Lynch 视角判断成长股 PE 是否被增长速度支撑。',
    scenario: '适合盈利已经稳定为正、但增长仍然较快的公司。',
    formula: 'PEG = PE ÷ 盈利增长率(%).',
    variables: [
      { symbol: 'PE', meaning: '市盈率', guidance: '用当前或预期 PE。' },
      { symbol: '增长率', meaning: '盈利增长率', guidance: '尽量用中期可持续增速。' },
    ],
    limitations: ['增长率越主观，PEG 参考性越弱。', '不适合利润波动很大的公司。'],
    fields: [
      numberField('pe', 'PE', 24, '当前 PE。', { min: 1, max: 80, step: 0.5 }),
      numberField('growthRate', '盈利增长率', 22, '盈利增长率，用百分比。', { min: 1, max: 60, unit: '%' }),
    ],
    sensitivityKeys: ['pe', 'growthRate'],
    compute: computePeg,
  }),
  createTool({
    id: 'cyclicality',
    slug: 'cyclicality',
    category: 'growth',
    name: 'Cyclicality Analyzer',
    shortName: '周期识别',
    priority: 'P3',
    tagline: '看清周期高点里的估值幻觉。',
    purpose: '通过 10 年利润率和当前 EV/EBIT，对周期股做中周期估值调整。',
    scenario: '在资源、化工、制造等利润波动较大的行业里尤其重要。',
    formula: '中周期 EBIT = 当前营收 × 10 年平均利润率。',
    variables: [
      { symbol: '中周期 EBIT', meaning: '正常化经营利润', guidance: '比当年 EBIT 更适合周期行业估值。' },
      { symbol: '利润率波动', meaning: '周期强度', guidance: '波动越大，估值越需要用中周期口径。' },
    ],
    limitations: ['如果行业结构发生永久变化，历史均值可能失效。', '当前营收本身也可能处于周期高点或低点。'],
    fields: [
      seriesField('revenueSeries', '营收序列', '9000, 9200, 8800, 9400, 10100, 9800, 10500, 11200, 11800, 12300', '最近 10 年营收。'),
      seriesField('marginSeries', 'EBIT 利润率', '6, 4, 3, 5, 7, 8, 6, 9, 11, 10', '最近 10 年 EBIT 利润率，用百分比。'),
      numberField('enterpriseValue', 'EV', 16000, '企业价值。', { min: 1000, max: 200000, step: 500 }),
    ],
    sensitivityKeys: ['enterpriseValue'],
    compute: computeCyclicality,
  }),
  createTool({
    id: 'scenario',
    slug: 'scenario',
    category: 'risk',
    name: '情景分析器',
    shortName: '情景分析',
    priority: 'P1',
    tagline: '把牛、基、熊三套假设放在同一个表里。',
    purpose: '在不同增长率与折现率情景下，评估估值区间与加权期望值。',
    scenario: '适合高不确定性公司或大仓位决策前做边界测试。',
    formula: '按牛市/基准/熊市分别估值，再按权重做加权平均。',
    variables: [
      { symbol: '权重', meaning: '情景概率近似', guidance: '默认牛 30%、基准 50%、熊 20%。' },
      { symbol: '终局增长率', meaning: '所有情景共享的长期增长假设', guidance: '通常维持 0%~3%。' },
    ],
    limitations: ['情景权重仍是主观判断。', '情景数增加并不等于更准确。'],
    fields: [
      numberField('baseFcf', '基准 FCF', 2800, '自由现金流。', { min: 100, max: 10000, step: 100 }),
      numberField('sharesOutstanding', '总股数', 760, '总股数。', { min: 100, max: 5000, step: 10 }),
      numberField('netCash', '净现金', 350, '净现金。', { min: -5000, max: 5000, step: 100 }),
      numberField('terminalGrowthRate', '永续增长率', 2.5, '长期增长率。', { min: 0, max: 4, unit: '%' }),
      numberField('bullGrowthRate', '牛市增长率', 16, '牛市增长率。', { min: -5, max: 30, unit: '%' }),
      numberField('bullWacc', '牛市 WACC', 8.2, '牛市折现率。', { min: 5, max: 15, unit: '%' }),
      numberField('baseGrowthRate', '基准增长率', 10, '基准增长率。', { min: -5, max: 30, unit: '%' }),
      numberField('baseWacc', '基准 WACC', 9.3, '基准折现率。', { min: 5, max: 15, unit: '%' }),
      numberField('bearGrowthRate', '熊市增长率', 4, '熊市增长率。', { min: -10, max: 30, unit: '%' }),
      numberField('bearWacc', '熊市 WACC', 10.8, '熊市折现率。', { min: 5, max: 18, unit: '%' }),
      numberField('currentPrice', '当前股价', 57, '当前市场价格。', { min: 1, max: 500, step: 1 }),
    ],
    sensitivityKeys: ['bullGrowthRate', 'baseGrowthRate', 'bearGrowthRate', 'baseWacc'],
    compute: computeScenarioAnalysis,
  }),
  createTool({
    id: 'sensitivity',
    slug: 'sensitivity',
    category: 'risk',
    name: '敏感度分析矩阵',
    shortName: '敏感度矩阵',
    priority: 'P1',
    tagline: '不要只看一个点估值。',
    purpose: '用 WACC 和永续增长率的组合，生成 5×5 的 DCF 热力矩阵。',
    scenario: '适合所有依赖终值的 DCF 模型，快速判断估值稳不稳。',
    formula: '在一组 WACC 与永续增长率假设下，重复计算 DCF 每股价值。',
    variables: [
      { symbol: 'WACC', meaning: '折现率轴', guidance: '默认围绕当前值上下 2%。' },
      { symbol: 'g', meaning: '永续增长率轴', guidance: '默认从 0% 到 4%。' },
    ],
    limitations: ['仍然建立在 FCF 基础假设之上。', '对极端假设给出的结果不应机械相信。'],
    fields: [
      numberField('baseFcf', '基准 FCF', 2600, '自由现金流。', { min: 100, max: 10000, step: 100 }),
      numberField('growthRate', '显性阶段增长率', 10, '前 5 年增长率。', { min: -5, max: 25, unit: '%' }),
      numberField('netCash', '净现金', 400, '净现金。', { min: -5000, max: 5000, step: 100 }),
      numberField('sharesOutstanding', '总股数', 720, '总股数。', { min: 100, max: 5000, step: 10 }),
      numberField('wacc', '中心 WACC', 9.5, '热力矩阵中心 WACC。', { min: 5, max: 15, unit: '%', sensitivity: true }),
      numberField('terminalGrowthRate', '中心永续增长率', 2, '当前定位用。', { min: 0, max: 4, unit: '%', sensitivity: true }),
    ],
    sensitivityKeys: ['wacc', 'terminalGrowthRate', 'growthRate'],
    compute: computeSensitivityMatrix,
  }),
  createTool({
    id: 'kelly',
    slug: 'kelly',
    category: 'risk',
    name: 'Kelly 公式仓位计算器',
    shortName: 'Kelly 仓位',
    priority: 'P2',
    tagline: '先决定下多大，再决定赚多少。',
    purpose: '根据胜率和盈亏比，给出 Full Kelly 与 Half Kelly 仓位建议。',
    scenario: '适合有明确赔率假设的仓位管理，而不是拿来替代基本面判断。',
    formula: 'Kelly % = (p × b - q) / b。',
    variables: [
      { symbol: 'p', meaning: '胜率', guidance: '你的判断正确概率。' },
      { symbol: 'b', meaning: '盈亏比', guidance: '平均盈利 / 平均亏损。' },
    ],
    limitations: ['对胜率误差极其敏感。', '最好只作为上限参考。'],
    fields: [
      numberField('winRate', '胜率', 58, '胜率，用百分比。', { min: 1, max: 99, unit: '%' }),
      numberField('payoffRatio', '盈亏比', 2.2, '平均盈利 / 平均亏损。', { min: 0.2, max: 10, step: 0.1 }),
    ],
    sensitivityKeys: ['winRate', 'payoffRatio'],
    compute: computeKelly,
  }),
  createTool({
    id: 'margin-of-safety',
    slug: 'margin-of-safety',
    category: 'risk',
    name: '安全边际汇总器',
    shortName: '安全边际汇总',
    priority: 'P0',
    tagline: '把不同估值方法汇成一个决策界面。',
    purpose: '聚合 DCF、Graham、相对估值、DDM 和自定义值，计算综合安全边际。',
    scenario: '适合在做最终买入决策时，把不同模型的结论放到一起。',
    formula: '加权内在价值 = Σ(估值结果 × 权重) / Σ权重。',
    variables: [
      { symbol: '权重', meaning: '方法重要性', guidance: '高确定性的模型可以给更高权重。' },
      { symbol: '综合安全边际', meaning: '加权值相对现价的折扣', guidance: '通常希望至少 20%~30%。' },
    ],
    limitations: ['不同模型之间并非完全独立。', '错误的权重会放大误导。'],
    fields: [
      numberField('dcfValue', 'DCF 值', 72, 'DCF 得到的合理股价。', { min: 1, max: 500, step: 1 }),
      numberField('dcfWeight', 'DCF 权重', 35, 'DCF 权重。', { min: 0, max: 100, step: 1 }),
      numberField('grahamValue', 'Graham 值', 58, 'Graham 得到的合理股价。', { min: 1, max: 500, step: 1 }),
      numberField('grahamWeight', 'Graham 权重', 15, 'Graham 权重。', { min: 0, max: 100, step: 1 }),
      numberField('multiplesValue', '相对估值值', 65, '相对估值得到的合理股价。', { min: 1, max: 500, step: 1 }),
      numberField('multiplesWeight', '相对估值权重', 20, '相对估值权重。', { min: 0, max: 100, step: 1 }),
      numberField('ddmValue', 'DDM 值', 60, 'DDM 得到的合理股价。', { min: 1, max: 500, step: 1 }),
      numberField('ddmWeight', 'DDM 权重', 10, 'DDM 权重。', { min: 0, max: 100, step: 1 }),
      numberField('customValue', '自定义估值', 68, '你自己的其他估值结果。', { min: 1, max: 500, step: 1 }),
      numberField('customWeight', '自定义权重', 20, '自定义权重。', { min: 0, max: 100, step: 1 }),
      numberField('currentPrice', '当前股价', 54, '当前市场价格。', { min: 1, max: 500, step: 1 }),
    ],
    sensitivityKeys: ['dcfValue', 'multiplesValue', 'currentPrice'],
    compute: computeMarginOfSafety,
  }),
  createTool({
    id: 'thesis',
    slug: 'thesis',
    category: 'journal',
    name: 'Investment Thesis Journal',
    shortName: '投资论点日志',
    priority: 'P3',
    tagline: '把买入理由和复盘留在同一个地方。',
    purpose: '记录代码、买入价、核心论点、假设、风险和卖出条件，并支持本地持久化与 CSV 导出。',
    scenario: '适合形成自己的投资闭环。',
    formula: '不适用。',
    variables: [],
    limitations: ['只做本地存储，不做云同步。'],
    fields: [],
    sensitivityKeys: [],
    renderMode: 'journal',
  }),
  createTool({
    id: 'portfolio',
    slug: 'portfolio',
    category: 'journal',
    name: 'Portfolio Tracker',
    shortName: '持仓追踪器',
    priority: 'P3',
    tagline: '把盈亏和安全边际放到一个表里。',
    purpose: '记录持仓、成本、现价和内在价值估算，追踪盈亏与安全边际。',
    scenario: '适合做组合视角的估值和风险管理。',
    formula: '盈亏 = (现价 - 成本) / 成本；安全边际 = (内在价值 - 现价) / 内在价值。',
    variables: [],
    limitations: ['只做本地持久化，不接券商。'],
    fields: [],
    sensitivityKeys: [],
    renderMode: 'portfolio',
  }),
  createTool({
    id: 'wacc',
    slug: 'wacc',
    category: 'tools',
    name: 'WACC 计算器',
    shortName: 'WACC',
    priority: 'P3',
    tagline: '单独拆解资本成本。',
    purpose: '独立计算 WACC，并对不同 Beta 假设做敏感度检查。',
    scenario: '适合在正式做 DCF 之前校准折现率。',
    formula: 'WACC = (E/V)×Re + (D/V)×Rd×(1-T)。',
    variables: [
      { symbol: 'Re', meaning: '股权成本', guidance: 'Rf + β × ERP。' },
      { symbol: 'Rd', meaning: '债务成本', guidance: '利息费用 / 平均债务。' },
    ],
    limitations: ['Beta 和 ERP 的估计方式差异很大。', '静态资本结构假设不一定长期成立。'],
    fields: [
      numberField('equityValue', '权益价值', 18000, '权益价值。', { min: 1000, max: 200000, step: 500 }),
      numberField('debtValue', '债务价值', 4200, '债务价值。', { min: 0, max: 100000, step: 100 }),
      numberField('taxRate', '税率', 22, '税率。', { min: 0, max: 40, unit: '%' }),
      numberField('riskFreeRate', '无风险利率', 4.1, 'Rf。', { min: 1, max: 10, unit: '%' }),
      numberField('beta', 'Beta', 1, 'Beta。', { min: 0.2, max: 2.5, step: 0.05 }),
      numberField('equityRiskPremium', '股权风险溢价', 5.5, 'ERP。', { min: 2, max: 10, unit: '%' }),
      numberField('interestExpense', '利息费用', 220, '利息费用。', { min: 1, max: 5000, step: 5 }),
      numberField('averageDebt', '平均债务', 4000, '平均债务。', { min: 100, max: 100000, step: 100 }),
    ],
    sensitivityKeys: ['beta', 'equityRiskPremium'],
    compute: computeWaccTool,
  }),
  createTool({
    id: 'compounder',
    slug: 'compounder',
    category: 'tools',
    name: '复利计算器',
    shortName: 'Compounder',
    priority: 'P3',
    tagline: '把长期回报拉成一条时间线。',
    purpose: '计算长期复利终值，并比较不同年化收益率路径。',
    scenario: '适合做目标规划，也适合作为教育辅助工具解释长期收益来源。',
    formula: '终值 = 初始资金 × (1+r)^n，支持每年追加。',
    variables: [
      { symbol: 'r', meaning: '年化收益率', guidance: '建议同时输入保守/基准/进取三档。' },
      { symbol: 'n', meaning: '年份', guidance: '尽量用长期区间观察复利。' },
    ],
    limitations: ['假设收益率恒定并不现实。', '不考虑通胀和税费。'],
    fields: [
      numberField('initialCapital', '初始资金', 100000, '起始投入。', { min: 0, max: 10000000, step: 1000 }),
      numberField('annualContribution', '每年追加', 24000, '每年追加投资。', { min: 0, max: 1000000, step: 1000 }),
      numberField('years', '投资年数', 15, '投资年数。', { min: 1, max: 50, step: 1 }),
      numberField('conservativeRate', '保守收益率', 6, '保守情景年化。', { min: 0, max: 20, unit: '%' }),
      numberField('baseRate', '基准收益率', 10, '基准情景年化。', { min: 0, max: 20, unit: '%' }),
      numberField('aggressiveRate', '进取收益率', 14, '进取情景年化。', { min: 0, max: 25, unit: '%' }),
    ],
    sensitivityKeys: ['years', 'baseRate', 'annualContribution'],
    compute: computeCompounder,
  }),
];

export const featuredTools = toolCatalog.filter((tool) => tool.priority === 'P0');

export const toolsByCategory = Object.entries(categoryMeta).map(([category, meta]) => ({
  category: category as ToolCategory,
  meta,
  tools: toolCatalog.filter((tool) => tool.category === category),
}));

export const findTool = (category: string | undefined, slug: string | undefined) =>
  toolCatalog.find((tool) => tool.category === category && tool.slug === slug);

export const getDefaultValues = (tool: ToolDefinition) =>
  tool.fields.reduce<Record<string, number | string>>((defaults, field) => {
    defaults[field.key] = field.defaultValue;
    return defaults;
  }, {});