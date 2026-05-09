import { Download, RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ChartRenderer from '../components/ChartRenderer';
import ToolForm from '../components/ToolForm';
import { findTool, getDefaultValues, toolsByCategory } from '../lib/toolkit';
import type { PortfolioEntry, JournalEntry } from '../store/useAppStore';
import useAppStore from '../store/useAppStore';

const downloadTextFile = (filename: string, text: string, type: string) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const buildCsv = (rows: Record<string, string | number>[]) => {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','));
  return [headers.join(','), ...lines].join('\n');
};

const journalTemplate: Omit<JournalEntry, 'id' | 'updatedAt'> = {
  ticker: '',
  buyPrice: 0,
  thesis: '',
  assumptions: '',
  risks: '',
  sellConditions: '',
  review: '',
};

const portfolioTemplate: Omit<PortfolioEntry, 'id' | 'updatedAt'> = {
  ticker: '',
  shares: 0,
  buyPrice: 0,
  currentPrice: 0,
  intrinsicValue: 0,
};

function JournalWorkbench() {
  const journalEntries = useAppStore((state) => state.journalEntries);
  const upsertJournalEntry = useAppStore((state) => state.upsertJournalEntry);
  const deleteJournalEntry = useAppStore((state) => state.deleteJournalEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(journalTemplate);

  const reset = () => {
    setEditingId(null);
    setDraft(journalTemplate);
  };

  const handleSave = () => {
    const entry: JournalEntry = {
      id: editingId ?? crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      ...draft,
      ticker: draft.ticker.trim().toUpperCase(),
    };
    upsertJournalEntry(entry);
    reset();
  };

  return (
    <main className="py-16">
      <div className="shell space-y-8">
        <section className="rounded-[40px] bg-navy px-8 py-12 text-white">
          <p className="section-kicker text-sky">Investment Journal</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.05em]">投资论点日志</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">把代码、买入价、核心论点、关键假设、主要风险和卖出条件记录下来。这里用 localStorage 保存，支持 CSV 导出。</p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <div className="metric-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">编辑器</p>
                <h2 className="panel-title mt-2">{editingId ? '更新条目' : '新建条目'}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                清空
              </button>
            </div>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="代码，例如 AAPL" type="text" value={draft.ticker} onChange={(event) => setDraft((state) => ({ ...state, ticker: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="买入价" type="number" value={draft.buyPrice} onChange={(event) => setDraft((state) => ({ ...state, buyPrice: Number(event.target.value) }))} />
            <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="核心论点" value={draft.thesis} onChange={(event) => setDraft((state) => ({ ...state, thesis: event.target.value }))} />
            <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="关键假设" value={draft.assumptions} onChange={(event) => setDraft((state) => ({ ...state, assumptions: event.target.value }))} />
            <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="主要风险" value={draft.risks} onChange={(event) => setDraft((state) => ({ ...state, risks: event.target.value }))} />
            <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="卖出条件" value={draft.sellConditions} onChange={(event) => setDraft((state) => ({ ...state, sellConditions: event.target.value }))} />
            <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="复盘记录" value={draft.review} onChange={(event) => setDraft((state) => ({ ...state, review: event.target.value }))} />
            <button className="pill-button w-full justify-center" type="button" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {editingId ? '更新条目' : '保存条目'}
            </button>
          </div>

          <div className="metric-card space-y-5" data-testid="journal-table">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">记录</p>
                <h2 className="panel-title mt-2">已保存条目</h2>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'mycloudai-investment-thesis.csv',
                    buildCsv(
                      journalEntries.map((entry) => ({
                        ticker: entry.ticker,
                        buyPrice: entry.buyPrice,
                        thesis: entry.thesis,
                        assumptions: entry.assumptions,
                        risks: entry.risks,
                        sellConditions: entry.sellConditions,
                        review: entry.review,
                        updatedAt: entry.updatedAt,
                      })),
                    ),
                    'text/csv',
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                导出 CSV
              </button>
            </div>
            {journalEntries.length ? (
              <div className="space-y-4">
                {journalEntries.map((entry) => (
                  <div key={entry.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-action">{entry.ticker}</p>
                        <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">买入价 {entry.buyPrice}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
                          type="button"
                          onClick={() => {
                            setEditingId(entry.id);
                            setDraft({
                              ticker: entry.ticker,
                              buyPrice: entry.buyPrice,
                              thesis: entry.thesis,
                              assumptions: entry.assumptions,
                              risks: entry.risks,
                              sellConditions: entry.sellConditions,
                              review: entry.review,
                            });
                          }}
                        >
                          编辑
                        </button>
                        <button className="rounded-full border border-rose-200 px-3 py-1.5 text-sm text-rose-600" type="button" onClick={() => deleteJournalEntry(entry.id)}>
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-600">
                      <p><span className="font-semibold text-ink">核心论点：</span>{entry.thesis}</p>
                      <p><span className="font-semibold text-ink">关键假设：</span>{entry.assumptions}</p>
                      <p><span className="font-semibold text-ink">主要风险：</span>{entry.risks}</p>
                      <p><span className="font-semibold text-ink">卖出条件：</span>{entry.sellConditions}</p>
                      <p><span className="font-semibold text-ink">复盘：</span>{entry.review}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">还没有保存任何投资论点。</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function PortfolioWorkbench() {
  const portfolioEntries = useAppStore((state) => state.portfolioEntries);
  const upsertPortfolioEntry = useAppStore((state) => state.upsertPortfolioEntry);
  const deletePortfolioEntry = useAppStore((state) => state.deletePortfolioEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(portfolioTemplate);

  const reset = () => {
    setEditingId(null);
    setDraft(portfolioTemplate);
  };

  const handleSave = () => {
    const entry: PortfolioEntry = {
      id: editingId ?? crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      ...draft,
      ticker: draft.ticker.trim().toUpperCase(),
    };
    upsertPortfolioEntry(entry);
    reset();
  };

  const summary = portfolioEntries.reduce(
    (state, entry) => {
      const marketValue = entry.currentPrice * entry.shares;
      const costValue = entry.buyPrice * entry.shares;
      const intrinsicValue = entry.intrinsicValue * entry.shares;
      return {
        marketValue: state.marketValue + marketValue,
        costValue: state.costValue + costValue,
        intrinsicValue: state.intrinsicValue + intrinsicValue,
      };
    },
    { marketValue: 0, costValue: 0, intrinsicValue: 0 },
  );

  const totalPnl = summary.costValue ? (summary.marketValue - summary.costValue) / summary.costValue : 0;
  const totalMargin = summary.intrinsicValue ? (summary.intrinsicValue - summary.marketValue) / summary.intrinsicValue : 0;

  return (
    <main className="py-16">
      <div className="shell space-y-8">
        <section className="rounded-[40px] bg-navy px-8 py-12 text-white">
          <p className="section-kicker text-sky">Portfolio Tracker</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.05em]">持仓追踪器</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">把持仓成本、现价和内在价值估算放到一个表里，持续跟踪组合盈亏与安全边际。</p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="metric-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">编辑器</p>
                <h2 className="panel-title mt-2">{editingId ? '更新持仓' : '新增持仓'}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                清空
              </button>
            </div>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="代码，例如 NVDA" type="text" value={draft.ticker} onChange={(event) => setDraft((state) => ({ ...state, ticker: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="股数" type="number" value={draft.shares} onChange={(event) => setDraft((state) => ({ ...state, shares: Number(event.target.value) }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="买入价" type="number" value={draft.buyPrice} onChange={(event) => setDraft((state) => ({ ...state, buyPrice: Number(event.target.value) }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="当前价" type="number" value={draft.currentPrice} onChange={(event) => setDraft((state) => ({ ...state, currentPrice: Number(event.target.value) }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="最新内在价值估算" type="number" value={draft.intrinsicValue} onChange={(event) => setDraft((state) => ({ ...state, intrinsicValue: Number(event.target.value) }))} />
            <button className="pill-button w-full justify-center" type="button" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {editingId ? '更新持仓' : '保存持仓'}
            </button>
          </div>

          <div className="space-y-6" data-testid="portfolio-table">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="metric-card">
                <p className="text-sm text-slate-500">组合市值</p>
                <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-ink">{summary.marketValue.toFixed(0)}</p>
              </div>
              <div className="metric-card">
                <p className="text-sm text-slate-500">组合盈亏</p>
                <p className={`mt-2 font-display text-4xl font-semibold tracking-[-0.04em] ${totalPnl >= 0 ? 'text-action' : 'text-rose-600'}`}>{(totalPnl * 100).toFixed(1)}%</p>
              </div>
              <div className="metric-card">
                <p className="text-sm text-slate-500">当前安全边际</p>
                <p className={`mt-2 font-display text-4xl font-semibold tracking-[-0.04em] ${totalMargin >= 0 ? 'text-action' : 'text-rose-600'}`}>{(totalMargin * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="metric-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-kicker">持仓明细</p>
                  <h2 className="panel-title mt-2">组合表</h2>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      'mycloudai-portfolio.csv',
                      buildCsv(
                        portfolioEntries.map((entry) => ({
                          ticker: entry.ticker,
                          shares: entry.shares,
                          buyPrice: entry.buyPrice,
                          currentPrice: entry.currentPrice,
                          intrinsicValue: entry.intrinsicValue,
                          updatedAt: entry.updatedAt,
                        })),
                      ),
                      'text/csv',
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  导出 CSV
                </button>
              </div>
              {portfolioEntries.length ? (
                <div className="space-y-4">
                  {portfolioEntries.map((entry) => {
                    const pnl = entry.buyPrice ? (entry.currentPrice - entry.buyPrice) / entry.buyPrice : 0;
                    const margin = entry.intrinsicValue ? (entry.intrinsicValue - entry.currentPrice) / entry.intrinsicValue : 0;
                    return (
                      <div key={entry.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-action">{entry.ticker}</p>
                            <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{entry.shares} 股</h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
                              type="button"
                              onClick={() => {
                                setEditingId(entry.id);
                                setDraft({
                                  ticker: entry.ticker,
                                  shares: entry.shares,
                                  buyPrice: entry.buyPrice,
                                  currentPrice: entry.currentPrice,
                                  intrinsicValue: entry.intrinsicValue,
                                });
                              }}
                            >
                              编辑
                            </button>
                            <button className="rounded-full border border-rose-200 px-3 py-1.5 text-sm text-rose-600" type="button" onClick={() => deletePortfolioEntry(entry.id)}>
                              删除
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-sm text-slate-500">买入价</p>
                            <p className="mt-1 text-lg font-semibold text-ink">{entry.buyPrice}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">当前价</p>
                            <p className="mt-1 text-lg font-semibold text-ink">{entry.currentPrice}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">盈亏</p>
                            <p className={`mt-1 text-lg font-semibold ${pnl >= 0 ? 'text-action' : 'text-rose-600'}`}>{(pnl * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">安全边际</p>
                            <p className={`mt-1 text-lg font-semibold ${margin >= 0 ? 'text-action' : 'text-rose-600'}`}>{(margin * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">还没有任何持仓记录。</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ToolPage() {
  const { category, slug } = useParams();
  const tool = findTool(category, slug);
  const setToolField = useAppStore((state) => state.setToolField);
  const replaceToolInputs = useAppStore((state) => state.replaceToolInputs);
  const toolValues = useAppStore((state) => (tool ? state.toolInputs[tool.id] : undefined));
  const [downloadState, setDownloadState] = useState('');

  if (!tool) {
    return <Navigate replace to="/" />;
  }

  if (tool.renderMode === 'journal') {
    return <JournalWorkbench />;
  }

  if (tool.renderMode === 'portfolio') {
    return <PortfolioWorkbench />;
  }

  const defaults = getDefaultValues(tool);
  const values = {
    ...defaults,
    ...(toolValues ?? {}),
  };
  const result = tool.compute ? tool.compute(values) : null;
  const categoryInfo = toolsByCategory.find((group) => group.category === tool.category);
  const relatedTools = categoryInfo?.tools ?? [];
  const pageAnchors = [
    { label: '用途与公式', href: '#tool-foundation' },
    { label: '输入区', href: '#tool-inputs' },
    { label: '结果区', href: '#tool-results' },
    { label: '计算明细', href: '#tool-details' },
    { label: '局限与解释', href: '#tool-insights' },
  ];

  return (
    <main className="py-16">
      <div className="shell space-y-8">
        <section className={`rounded-[40px] px-8 py-12 ${tool.category === 'risk' ? 'bg-navy text-white' : 'bg-white text-ink'}`} data-testid={`tool-page-${tool.slug}`}>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link className={`${tool.category === 'risk' ? 'text-sky' : 'text-action'}`} to="/">
              总览
            </Link>
            <span className={tool.category === 'risk' ? 'text-slate-500' : 'text-slate-300'}>/</span>
            <Link className={tool.category === 'risk' ? 'text-slate-300' : 'text-slate-500'} to={`/${tool.category}`}>
              {categoryInfo?.meta.label}
            </Link>
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className={`section-kicker ${tool.category === 'risk' ? 'text-sky' : ''}`}>{tool.priority}</p>
              <h1 className={`mt-3 font-display text-5xl font-semibold tracking-[-0.05em] ${tool.category === 'risk' ? 'text-white' : 'text-ink'}`}>{tool.name}</h1>
              <p className={`mt-4 max-w-3xl text-lg leading-8 ${tool.category === 'risk' ? 'text-slate-300' : 'text-slate-600'}`}>{tool.tagline}</p>
            </div>
            <div className={`rounded-[32px] border p-6 ${tool.category === 'risk' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-mist'}`}>
              <p className={`text-sm ${tool.category === 'risk' ? 'text-sky' : 'text-action'}`}>使用场景</p>
              <p className={`mt-2 text-base leading-7 ${tool.category === 'risk' ? 'text-slate-200' : 'text-slate-700'}`}>{tool.scenario}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            {result ? (
              <div className="metric-card space-y-4">
                <div>
                  <p className="section-kicker">即看结果</p>
                  <h2 className="panel-title mt-2">不用先滚到图表区</h2>
                </div>
                <div className="space-y-3">
                  {result.summary.slice(0, 3).map((metric) => (
                    <div key={metric.label} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="metric-card space-y-4">
              <div>
                <p className="section-kicker">同类工具</p>
                <h2 className="panel-title mt-2">在这个分类里切换</h2>
              </div>
              <div className="space-y-2">
                {relatedTools.map((relatedTool) => (
                  <Link
                    key={relatedTool.id}
                    className={`block rounded-[20px] px-4 py-3 text-sm transition ${
                      relatedTool.id === tool.id ? 'bg-action text-white' : 'bg-slate-50 text-slate-700 hover:bg-mist hover:text-action'
                    }`}
                    to={relatedTool.route}
                  >
                    {relatedTool.shortName}
                  </Link>
                ))}
              </div>
            </div>

            <div className="metric-card space-y-4">
              <div>
                <p className="section-kicker">页面导览</p>
                <h2 className="panel-title mt-2">快速跳到对应区域</h2>
              </div>
              <div className="space-y-2">
                {pageAnchors.map((anchor) => (
                  <a key={anchor.href} className="block rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-mist hover:text-action" href={anchor.href}>
                    {anchor.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]" id="tool-foundation">
              <div className="metric-card space-y-4">
                <div>
                  <p className="section-kicker">用途</p>
                  <h2 className="panel-title mt-2">这项工具适合什么时候用</h2>
                </div>
                <p className="body-copy">{tool.purpose}</p>
                <div>
                  <p className="section-kicker">公式</p>
                  <p className="mt-2 text-base leading-7 text-slate-700">{tool.formula}</p>
                </div>
                {tool.variables.length ? (
                  <div className="space-y-3">
                    {tool.variables.map((variable) => (
                      <div key={variable.symbol} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-ink">{variable.symbol}</p>
                        <p className="mt-1 text-sm text-slate-700">{variable.meaning}</p>
                        <p className="mt-1 text-sm text-slate-500">{variable.guidance}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="metric-card" id="tool-inputs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="section-kicker">输入区</p>
                    <h2 className="panel-title mt-2">数字可直接输入，也可拖拽敏感参数</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        replaceToolInputs(tool.id, defaults);
                        setDownloadState('已恢复默认参数。');
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      恢复默认
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        downloadTextFile(`${tool.slug}-inputs.json`, JSON.stringify(values, null, 2), 'application/json');
                        setDownloadState('已导出当前输入。');
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      导出输入
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  <ToolForm fields={tool.fields} values={values} onChange={(key, value) => setToolField(tool.id, key, value)} />
                </div>
                {downloadState ? <p className="mt-4 text-sm text-slate-500">{downloadState}</p> : null}
              </div>
            </section>

            {result ? (
              <>
                <section className="space-y-6" id="tool-results">
                  <div>
                    <p className="section-kicker">结果区</p>
                    <h2 className="section-heading mt-2">核心数字与图表</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {result.summary.map((metric, index) => (
                      <div key={metric.label} className="metric-card" data-testid={`summary-metric-${index}`}>
                        <p className="text-sm text-slate-500">{metric.label}</p>
                        <p
                          className={`mt-3 font-display text-4xl font-semibold tracking-[-0.04em] ${
                            metric.tone === 'positive' ? 'text-action' : metric.tone === 'negative' ? 'text-rose-600' : 'text-ink'
                          }`}
                        >
                          {metric.value}
                        </p>
                        {metric.note ? <p className="mt-2 text-sm leading-6 text-slate-500">{metric.note}</p> : null}
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-6 xl:grid-cols-2">
                    {result.charts.map((chart) => (
                      <ChartRenderer key={chart.title} chart={chart} />
                    ))}
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]" id="tool-details">
                  <div className="metric-card space-y-4">
                    <div>
                      <p className="section-kicker">计算明细</p>
                      <h2 className="panel-title mt-2">逐步展示推导过程</h2>
                    </div>
                    <div className="space-y-3">
                      {result.details.map((item) => (
                        <div key={item.label} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-ink">{item.label}</p>
                            <p className="text-sm font-medium text-slate-700">{item.value}</p>
                          </div>
                          {item.hint ? <p className="mt-2 text-sm leading-6 text-slate-500">{item.hint}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6" id="tool-insights">
                    <div className="metric-card space-y-4">
                      <div>
                        <p className="section-kicker">敏感度</p>
                        <h2 className="panel-title mt-2">实时拖动关键参数</h2>
                      </div>
                      <div className="space-y-5">
                        {tool.fields
                          .filter((field) => tool.sensitivityKeys.includes(field.key) && field.type === 'number' && typeof field.min === 'number' && typeof field.max === 'number')
                          .map((field) => (
                            <div key={field.key}>
                              <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                                <span>{field.label}</span>
                                <span>{values[field.key]}</span>
                              </div>
                              <input
                                className="w-full accent-[#0066cc]"
                                max={field.max}
                                min={field.min}
                                step={field.step}
                                type="range"
                                value={Number(values[field.key])}
                                onChange={(event) => setToolField(tool.id, field.key, Number(event.target.value))}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="metric-card space-y-4">
                      <div>
                        <p className="section-kicker">结论</p>
                        <h2 className="panel-title mt-2">解释与局限</h2>
                      </div>
                      <p className="body-copy">{result.narrative}</p>
                      <div className="space-y-3">
                        {tool.limitations.map((limitation) => (
                          <div key={limitation} className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                            {limitation}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}