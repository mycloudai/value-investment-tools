import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartSpec } from '../lib/toolkit';

const tooltipStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  backgroundColor: 'rgba(255,255,255,0.96)',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)',
};

const formatHeat = (value: number, min: number, max: number) => {
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  const lightness = 96 - ratio * 36;
  return `hsl(211 100% ${lightness}%)`;
};

export default function ChartRenderer({ chart }: { chart: ChartSpec }) {
  return (
    <div className="metric-card h-[360px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink">{chart.title}</h3>
      </div>
      {chart.type === 'line' ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart.data}>
            <CartesianGrid stroke="#edf2f7" strokeDasharray="3 3" />
            <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 12 }} />
            <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {chart.lines.map((line) => (
              <Line key={line.key} dataKey={line.key} name={line.label} stroke={line.color} strokeWidth={2.4} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : null}
      {chart.type === 'bar' || chart.type === 'histogram' ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data}>
            <CartesianGrid stroke="#edf2f7" strokeDasharray="3 3" />
            <XAxis dataKey={chart.xKey} tick={{ fill: '#475569', fontSize: 12 }} />
            <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {chart.bars.map((bar) => (
              <Bar key={bar.key} dataKey={bar.key} name={bar.label} fill={bar.color} radius={[10, 10, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : null}
      {chart.type === 'pie' ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Pie data={chart.data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
              {chart.data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : null}
      {chart.type === 'radar' ? (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chart.data}>
            <PolarGrid stroke="#dbeafe" />
            <PolarAngleAxis dataKey={chart.angleKey} tick={{ fill: '#334155', fontSize: 12 }} />
            <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {chart.series.map((series) => (
              <Radar key={series.key} dataKey={series.key} name={series.label} fill={series.color} fillOpacity={0.18} stroke={series.color} strokeWidth={2} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      ) : null}
      {chart.type === 'heatmap' ? (
        <div className="grid h-full grid-cols-[120px_repeat(5,minmax(0,1fr))] gap-2 text-sm">
          <div />
          {chart.columns.map((column) => (
            <div key={column} className="flex items-center justify-center rounded-2xl bg-slate-50 px-2 py-2 font-medium text-slate-600">
              {column}
            </div>
          ))}
          {chart.rows.map((row) => (
            <div key={row} className="contents">
              <div className="flex items-center rounded-2xl bg-slate-50 px-3 py-2 font-medium text-slate-600">
                {row}
              </div>
              {chart.columns.map((column) => {
                const values = chart.cells.map((cell) => cell.value);
                const cell = chart.cells.find((item) => item.row === row && item.column === column);
                const isHighlight = chart.highlight?.row === row && chart.highlight?.column === column;
                return (
                  <div
                    key={`${row}-${column}`}
                    className={`flex items-center justify-center rounded-2xl border px-3 py-4 text-center font-medium text-slate-700 ${isHighlight ? 'border-action ring-2 ring-action/30' : 'border-transparent'}`}
                    style={{ backgroundColor: formatHeat(cell?.value ?? 0, Math.min(...values), Math.max(...values)) }}
                  >
                    {cell?.value.toFixed(1)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}