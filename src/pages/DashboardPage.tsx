import { ArrowRight, Database, NotebookPen, ShieldCheck } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../icons/mycloudai-small.png';
import { featuredTools, toolCatalog, toolsByCategory } from '../lib/toolkit';

export default function DashboardPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const filteredTools = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();
    if (!keyword) {
      return toolCatalog;
    }

    return toolCatalog.filter((tool) => {
      const searchableText = [tool.name, tool.shortName, tool.tagline, tool.purpose, tool.scenario].join(' ').toLowerCase();
      return searchableText.includes(keyword);
    });
  }, [deferredQuery]);

  return (
    <main>
      <section className="overflow-hidden bg-navy text-white">
        <div className="shell grid gap-14 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:py-28" data-testid="dashboard-hero">
          <div className="space-y-8 animate-rise">
            <p className="section-kicker text-sky">MyCloudAI Value Investment Suite</p>
            <div className="space-y-5">
              <h1 className="font-display text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                MyCloudAI 价值投资工具
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                以蓝色为主视觉，按 Apple 风格重做的价值投资工作台。覆盖估值、财务健康、成长质量、风险控制、投资日志与教育辅助，把研究、记录与复盘放到同一个地方。
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link className="pill-button" to="/valuation/dcf-two-stage">
                进入两阶段 DCF
              </Link>
              <Link className="ghost-button border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" to="/data">
                打开数据中心
              </Link>
            </div>
          </div>
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="absolute inset-0 rounded-[48px] bg-[#0b2749]" />
            <div className="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#0a203a] p-8 shadow-2xl shadow-black/25">
              <img alt="MyCloudAI 标志" className="w-full max-w-[440px] rounded-[40px] bg-white object-contain p-6 shadow-product" src={logo} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-parchment py-10">
        <div className="shell flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">搜索工具</p>
            <h2 className="panel-title mt-2">按名称、用途或场景快速定位</h2>
          </div>
          <input
            className="w-full rounded-full border border-slate-200 bg-white px-6 py-4 text-base outline-none transition focus:border-action focus:ring-2 focus:ring-action/20 lg:max-w-xl"
            placeholder="例如：DCF、F-Score、复利、敏感度"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      <section className="py-20">
        <div className="shell">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="section-kicker">重点入口</p>
              <h2 className="section-heading mt-2">先从最常用的 P0 工具开始</h2>
            </div>
            <Link className="text-sm font-medium text-action" to="/journal">
              进入分类页
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            {featuredTools.map((tool, index) => (
              <Link
                key={tool.id}
                className={`block rounded-[30px] border p-6 transition hover:-translate-y-1 hover:shadow-xl ${index % 2 === 0 ? 'border-slate-200 bg-white' : 'border-white/10 bg-navy text-white'}`}
                data-testid={`tool-card-${tool.slug}`}
                to={tool.route}
              >
                <p className={`text-xs uppercase tracking-[0.2em] ${index % 2 === 0 ? 'text-action' : 'text-sky'}`}>{tool.priority}</p>
                <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">{tool.shortName}</h3>
                <p className={`mt-3 text-sm leading-6 ${index % 2 === 0 ? 'text-slate-600' : 'text-slate-300'}`}>{tool.tagline}</p>
                <span className={`mt-8 inline-flex items-center gap-2 text-sm font-medium ${index % 2 === 0 ? 'text-action' : 'text-sky'}`}>
                  打开工具
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="shell space-y-14">
          {toolsByCategory.map(({ category, meta, tools }, sectionIndex) => {
            const shownTools = query ? filteredTools.filter((tool) => tool.category === category) : tools;
            if (!shownTools.length) {
              return null;
            }

            return (
              <div key={category} className="space-y-6">
                <div className={`rounded-[36px] px-8 py-10 ${sectionIndex % 2 === 0 ? 'bg-mist' : 'bg-navy text-white'}`}>
                  <p className={`section-kicker ${sectionIndex % 2 === 0 ? '' : 'text-sky'}`}>{meta.label}</p>
                  <h2 className={`mt-3 font-display text-4xl font-semibold tracking-[-0.04em] ${sectionIndex % 2 === 0 ? 'text-ink' : 'text-white'}`}>{meta.summary}</h2>
                  <p className={`mt-4 max-w-3xl text-lg leading-8 ${sectionIndex % 2 === 0 ? 'text-slate-600' : 'text-slate-300'}`}>{meta.description}</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {shownTools.map((tool) => (
                    <Link key={tool.id} className="metric-card group" data-testid={`tool-card-${tool.slug}`} to={tool.route}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-action">{tool.priority}</p>
                          <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{tool.shortName}</h3>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:text-action" />
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{tool.tagline}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-navy py-20 text-white">
        <div className="shell grid gap-6 lg:grid-cols-3">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
            <Database className="h-8 w-8 text-sky" />
            <h3 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em]">研究数据集中整理</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">数据中心支持抓取研究包、查看关键字段，并把数据预填到估值和财务健康工具。</p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
            <ShieldCheck className="h-8 w-8 text-sky" />
            <h3 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em]">风险与安全边际一起看</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">从情景分析、敏感度矩阵到 Kelly 仓位，把估值判断和仓位控制放到同一套流程里。</p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
            <NotebookPen className="h-8 w-8 text-sky" />
            <h3 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em]">把论点、持仓和复盘留住</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">投资日志和持仓追踪器帮助你记录买入逻辑、现价变化和安全边际，而不是只看一次性的结果。</p>
          </div>
        </div>
      </section>
    </main>
  );
}