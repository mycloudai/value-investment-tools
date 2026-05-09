import { Download, RefreshCw, Upload } from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deriveFmpResearchSnapshot, fmpEndpointOptions, fmpResearchEndpoints, type FmpEndpointKey } from '../lib/fmp';
import useAppStore from '../store/useAppStore';

const downloadFile = (filename: string, text: string, type: string) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function DataLabPage() {
  const apiKey = useAppStore((state) => state.apiKey);
  const setApiKey = useAppStore((state) => state.setApiKey);
  const cachedFmpData = useAppStore((state) => state.cachedFmpData);
  const cacheFmpPayload = useAppStore((state) => state.cacheFmpPayload);
  const importSnapshot = useAppStore((state) => state.importSnapshot);
  const replaceToolInputs = useAppStore((state) => state.replaceToolInputs);
  const journalEntries = useAppStore((state) => state.journalEntries);
  const portfolioEntries = useAppStore((state) => state.portfolioEntries);
  const toolInputs = useAppStore((state) => state.toolInputs);
  const [ticker, setTicker] = useState('AAPL');
  const [endpoint, setEndpoint] = useState<FmpEndpointKey>(fmpEndpointOptions[0].value);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const activeTicker = ticker.toUpperCase();

  const snapshot = useMemo(
    () => ({
      apiKey,
      cachedFmpData,
      journalEntries,
      portfolioEntries,
      toolInputs,
    }),
    [apiKey, cachedFmpData, journalEntries, portfolioEntries, toolInputs],
  );

  const researchSnapshot = useMemo(
    () => deriveFmpResearchSnapshot(activeTicker, cachedFmpData[activeTicker] ?? {}),
    [activeTicker, cachedFmpData],
  );

  const fetchEndpoint = async (requestedEndpoint: FmpEndpointKey) => {
    const response = await fetch(`https://financialmodelingprep.com/api/v3/${requestedEndpoint}/${activeTicker}?apikey=${apiKey}`);
    if (!response.ok) {
      throw new Error(`${requestedEndpoint} 请求失败：${response.status}`);
    }

    return response.json();
  };

  const handleFetch = async () => {
    if (!apiKey.trim()) {
      setStatus('请先填写 FMP API Key。');
      return;
    }

    setLoading(true);
    setStatus('正在抓取数据...');

    try {
      const payload = await fetchEndpoint(endpoint);
      cacheFmpPayload(activeTicker, endpoint, payload);
      setStatus(`已缓存 ${activeTicker} 的 ${endpoint} 数据。`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '抓取失败。');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchResearchBundle = async () => {
    if (!apiKey.trim()) {
      setStatus('请先填写 FMP API Key。');
      return;
    }

    setLoading(true);
    setStatus('正在抓取研究包...');

    try {
      const bundle = await Promise.all(
        fmpResearchEndpoints.map(async (requestedEndpoint) => [requestedEndpoint, await fetchEndpoint(requestedEndpoint)] as const),
      );

      bundle.forEach(([requestedEndpoint, payload]) => {
        cacheFmpPayload(activeTicker, requestedEndpoint, payload);
      });

      const nextSnapshot = deriveFmpResearchSnapshot(activeTicker, Object.fromEntries(bundle) as Record<string, unknown>);
      setStatus(`已更新 ${activeTicker} 的研究包，并生成 ${nextSnapshot.suggestions.length} 个工具建议。`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '研究包抓取失败。');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    try {
      importSnapshot(JSON.parse(text));
      setStatus('快照导入完成。');
    } catch {
      setStatus('导入失败，请确认 JSON 格式正确。');
    }
  };

  return (
    <main className="py-16">
      <div className="shell space-y-8">
        <section className="rounded-[40px] bg-navy px-8 py-12 text-white">
          <p className="section-kicker text-sky">Data Center</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.05em]">AI Native 数据中台</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            这里不再只是缓存原始 FMP JSON，而是把研究包直接映射到估值、财务健康和风险工具。你可以先抓研究包，再一键把数据灌进对应模型；同时整个工作台仍然支持本地快照导入导出。
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="metric-card space-y-5">
            <div>
              <p className="section-kicker">FMP 设置</p>
              <h2 className="panel-title mt-2">拉取研究包并映射到工具</h2>
            </div>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-action focus:ring-2 focus:ring-action/20"
              placeholder="输入 FMP API Key"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-action focus:ring-2 focus:ring-action/20"
                placeholder="Ticker，例如 AAPL"
                type="text"
                value={ticker}
                onChange={(event) => setTicker(event.target.value.toUpperCase())}
              />
              <select
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-action focus:ring-2 focus:ring-action/20"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value as FmpEndpointKey)}
              >
                {fmpEndpointOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button className="pill-button w-full justify-center" data-testid="fmp-bundle-fetch" disabled={loading} type="button" onClick={handleFetchResearchBundle}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? '抓取中...' : '抓取研究包'}
              </button>
              <button className="ghost-button w-full justify-center" disabled={loading} type="button" onClick={handleFetch}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                抓取当前端点
              </button>
            </div>
            <p className="text-sm text-slate-500">{status || '缓存会保存到本地 localStorage，可配合快照导出。'}</p>
          </div>

          <div className="metric-card space-y-5">
            <div>
              <p className="section-kicker">快照</p>
              <h2 className="panel-title mt-2">导出或导入整个工作台</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              导出会包含工具输入、API Key、缓存的 FMP 数据、投资日志和持仓表。导入时会按字段合并到当前本地状态。
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                className="ghost-button w-full justify-center"
                type="button"
                onClick={() => downloadFile('mycloudai-investment-snapshot.json', JSON.stringify(snapshot, null, 2), 'application/json')}
              >
                <Download className="mr-2 h-4 w-4" />
                导出 JSON
              </button>
              <label className="ghost-button w-full cursor-pointer justify-center">
                <Upload className="mr-2 h-4 w-4" />
                导入 JSON
                <input className="hidden" type="file" accept="application/json" onChange={handleImport} />
              </label>
            </div>
          </div>
        </section>

        <section className="metric-card space-y-6" data-testid="fmp-research-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Research Bundle</p>
              <h2 className="panel-title mt-2">高价值字段与一键预填</h2>
            </div>
            <p className="text-sm text-slate-500">
              已缓存 {researchSnapshot.availableEndpoints.length} / {fmpResearchEndpoints.length} 个端点
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="fmp-highlights">
            {researchSnapshot.highlights.map((highlight) => (
              <div key={highlight.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{highlight.label}</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{highlight.value}</p>
                {highlight.note ? <p className="mt-2 text-sm text-slate-500">{highlight.note}</p> : null}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-kicker">建议工作流</p>
                <h3 className="panel-title mt-2">直接把 FMP 数据灌进现有工具</h3>
              </div>
              {researchSnapshot.missingEndpoints.length ? (
                <p className="text-sm text-slate-500">仍缺少：{researchSnapshot.missingEndpoints.join('、')}</p>
              ) : null}
            </div>
            {researchSnapshot.suggestions.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {researchSnapshot.suggestions.map((suggestion) => (
                  <div key={suggestion.toolId} className="rounded-[24px] border border-slate-200 bg-white p-5" data-testid={`fmp-suggestion-${suggestion.toolId}`}>
                    <p className="text-xs uppercase tracking-[0.18em] text-action">{activeTicker}</p>
                    <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{suggestion.toolName}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{suggestion.rationale}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      {suggestion.coverage.map((coverageKey) => (
                        <span key={coverageKey} className="rounded-full bg-mist px-3 py-1">{coverageKey}</span>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        className="pill-button"
                        type="button"
                        onClick={() => {
                          replaceToolInputs(suggestion.toolId, suggestion.values);
                          setStatus(`已把 ${activeTicker} 的研究包参数预填到 ${suggestion.toolName}。`);
                        }}
                      >
                        应用到工具
                      </button>
                      <Link className="ghost-button" to={suggestion.route}>
                        打开工具
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">先抓取研究包，系统会把 FMP 数据转换成适配现有模型的输入建议。</p>
            )}
          </div>
        </section>

        <section className="metric-card space-y-5">
          <div>
            <p className="section-kicker">缓存总览</p>
            <h2 className="panel-title mt-2">当前已缓存标的</h2>
          </div>
          {Object.keys(cachedFmpData).length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(cachedFmpData).map(([cachedTicker, payloads]) => (
                <div key={cachedTicker} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-action">Ticker</p>
                  <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{cachedTicker}</h3>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {Object.keys(payloads).map((payloadKey) => (
                      <li key={payloadKey}>已缓存 {payloadKey}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">当前还没有缓存数据。</p>
          )}
        </section>
      </div>
    </main>
  );
}