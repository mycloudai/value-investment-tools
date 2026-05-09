import { ArrowRight } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toolsByCategory, type ToolCategory } from '../lib/toolkit';

const workflows: Record<ToolCategory, string[]> = {
  valuation: ['先做两阶段 DCF 确定价值锚点', '再用反向 DCF 读取市场预期', '最后用安全边际汇总器做决策'],
  health: ['先用 F-Score 过滤价值陷阱', '再看 ROIC vs WACC 判断价值创造', '最后补债务与现金流质量'],
  growth: ['先看 CAGR 与再投资率', '再确认毛利率和每股指标趋势', '最后判断是否存在周期错觉'],
  risk: ['先做三情景估值看区间', '再看敏感度矩阵识别脆弱点', '最后用 Kelly 控制仓位'],
  journal: ['先记录 Thesis 与假设', '再维护组合与安全边际', '用复盘不断修正自己的决策框架'],
  tools: ['先校准 WACC', '再用复利工具看长期收益路径', '把结果回填到估值与组合决策'],
};

export default function CategoryPage() {
  const { category } = useParams();
  const group = toolsByCategory.find((item) => item.category === category);

  if (!group) {
    return <Navigate replace to="/" />;
  }

  const featured = group.tools.filter((tool) => tool.priority === 'P0');

  return (
    <main className="py-16">
      <div className="shell space-y-8" data-testid={`category-page-${group.category}`}>
        <section className={`rounded-[40px] px-8 py-12 ${group.category === 'risk' ? 'bg-navy text-white' : 'bg-white text-ink'}`}>
          <p className={`section-kicker ${group.category === 'risk' ? 'text-sky' : ''}`}>{group.meta.label}</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className={`font-display text-5xl font-semibold tracking-[-0.05em] ${group.category === 'risk' ? 'text-white' : 'text-ink'}`}>{group.meta.summary}</h1>
              <p className={`mt-4 max-w-3xl text-lg leading-8 ${group.category === 'risk' ? 'text-slate-300' : 'text-slate-600'}`}>{group.meta.description}</p>
            </div>
            <div className={`rounded-[32px] border p-6 ${group.category === 'risk' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-mist'}`}>
              <p className={`text-sm ${group.category === 'risk' ? 'text-sky' : 'text-action'}`}>推荐使用顺序</p>
              <div className="mt-4 space-y-3">
                {workflows[group.category].map((step, index) => (
                  <div key={step} className={`rounded-[20px] px-4 py-3 text-sm leading-6 ${group.category === 'risk' ? 'bg-white/5 text-slate-200' : 'bg-white text-slate-700'}`}>
                    {index + 1}. {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="metric-card">
            <p className="text-sm text-slate-500">分类内工具</p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-ink">{group.tools.length}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-slate-500">P0 重点工具</p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-ink">{featured.length}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-slate-500">建议起手式</p>
            <p className="mt-2 text-lg font-semibold text-action">{group.tools[0]?.shortName}</p>
          </div>
        </section>

        {featured.length ? (
          <section className="space-y-6">
            <div>
              <p className="section-kicker">优先入口</p>
              <h2 className="section-heading mt-2">先处理最常用的核心工具</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {featured.map((tool) => (
                <Link key={tool.id} className="rounded-[30px] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl" to={tool.route}>
                  <p className="text-xs uppercase tracking-[0.2em] text-action">{tool.priority}</p>
                  <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{tool.shortName}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{tool.tagline}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-action">
                    打开工具
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-6">
          <div>
            <p className="section-kicker">完整列表</p>
            <h2 className="section-heading mt-2">先选分类，再选工具</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {group.tools.map((tool) => (
              <Link key={tool.id} className="metric-card group" to={tool.route}>
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
        </section>
      </div>
    </main>
  );
}