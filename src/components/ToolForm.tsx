import { currencyLabels, type CurrencyCode, type InputField } from '../lib/toolkit';

interface ToolFormProps {
  displayCurrency: CurrencyCode;
  fields: InputField[];
  values: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
}

const amountKeyPattern = /(price|cash|fcf|value|income|earnings|dividend|debt|capital|asset|liabilit|equity|sales|revenue|expense|ebit|nopat|market)/i;
const shareKeyPattern = /(shares|shareCount)/i;

const resolveFieldBadge = (field: InputField, displayCurrency: CurrencyCode) => {
  if (field.unit === '%') {
    return '单位：百分比 %';
  }

  if (field.unit) {
    return `单位：${field.unit}`;
  }

  const token = `${field.key} ${field.label}`;
  if (shareKeyPattern.test(field.key) || /股/.test(token)) {
    return '单位：股；金额保持同数量级';
  }

  if (/years/i.test(field.key) || /年/.test(field.label)) {
    return '单位：年';
  }

  if (amountKeyPattern.test(field.key) || /(现金|股价|价值|营收|收入|利润|资本|负债|股息|FCF|EV|NOPAT)/.test(token)) {
    return `货币：${currencyLabels[displayCurrency]}`;
  }

  return null;
};

const renderNumericValue = (value: number | string | undefined) => {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ToolForm({ displayCurrency, fields, values, onChange }: ToolFormProps) {
  return (
    <div className="space-y-5">
      {fields.map((field) => {
        const badge = resolveFieldBadge(field, displayCurrency);

        return (
          <div key={field.key} className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <label className="text-base font-semibold text-ink" htmlFor={field.key}>
                {field.label}
              </label>
              <p className="mt-1 text-[15px] leading-6 text-slate-500">{field.description}</p>
            </div>
            {badge ? (
              <span className="rounded-full bg-mist px-3 py-1 text-sm font-medium text-action">{badge}</span>
            ) : null}
          </div>
          <div className="mt-4">
            {field.type === 'number' ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-action focus:ring-2 focus:ring-action/20"
                  data-testid={`input-${field.key}`}
                  id={field.key}
                  max={field.max}
                  min={field.min}
                  step={field.step}
                  type="number"
                  value={renderNumericValue(values[field.key])}
                  onChange={(event) => onChange(field.key, Number(event.target.value))}
                />
                {typeof field.min === 'number' && typeof field.max === 'number' ? (
                  <p className="text-sm text-slate-400">
                    建议范围 {field.min} - {field.max}
                    {field.unit ? field.unit : ''}
                  </p>
                ) : null}
              </div>
            ) : null}
            {field.type === 'series' ? (
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-action focus:ring-2 focus:ring-action/20"
                data-testid={`input-${field.key}`}
                id={field.key}
                placeholder={field.placeholder}
                type="text"
                value={String(values[field.key] ?? '')}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            ) : null}
            {field.type === 'select' ? (
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-action focus:ring-2 focus:ring-action/20"
                data-testid={`input-${field.key}`}
                id={field.key}
                value={String(values[field.key] ?? '')}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
            {field.type === 'textarea' ? (
              <textarea
                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-action focus:ring-2 focus:ring-action/20"
                data-testid={`input-${field.key}`}
                id={field.key}
                placeholder={field.placeholder}
                value={String(values[field.key] ?? '')}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            ) : null}
          </div>
          </div>
        );
      })}
    </div>
  );
}