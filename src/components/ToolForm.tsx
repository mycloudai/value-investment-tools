import type { InputField } from '../lib/toolkit';

interface ToolFormProps {
  fields: InputField[];
  values: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
}

const renderNumericValue = (value: number | string | undefined) => {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ToolForm({ fields, values, onChange }: ToolFormProps) {
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.key} className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <label className="text-sm font-semibold text-ink" htmlFor={field.key}>
                {field.label}
              </label>
              <p className="mt-1 text-sm leading-6 text-slate-500">{field.description}</p>
            </div>
            {field.unit ? <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-action">{field.unit}</span> : null}
          </div>
          <div className="mt-4">
            {field.type === 'number' ? (
              <div className="space-y-3">
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
                  <input
                    className="w-full accent-[#0066cc]"
                    max={field.max}
                    min={field.min}
                    step={field.step}
                    type="range"
                    value={renderNumericValue(values[field.key])}
                    onChange={(event) => onChange(field.key, Number(event.target.value))}
                  />
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
      ))}
    </div>
  );
}