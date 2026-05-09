import { Database, LayoutDashboard, NotebookPen } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { categoryMeta } from '../lib/toolkit';

const navItems = [
  { label: '总览', to: '/', icon: LayoutDashboard, end: true },
  { label: categoryMeta.valuation.label, to: '/valuation', icon: LayoutDashboard },
  { label: categoryMeta.health.label, to: '/health', icon: LayoutDashboard },
  { label: categoryMeta.growth.label, to: '/growth', icon: LayoutDashboard },
  { label: categoryMeta.risk.label, to: '/risk', icon: LayoutDashboard },
  { label: categoryMeta.journal.label, to: '/journal', icon: NotebookPen },
  { label: '数据中心', to: '/data', icon: Database },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
    isActive ? 'bg-white text-ink' : 'text-slate-300 hover:bg-white/10 hover:text-white'
  }`;

export default function Layout() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-ink">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 backdrop-blur">
        <div className="shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <NavLink to="/">
            <BrandLogo />
          </NavLink>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} className={navClass} end={item.end} to={item.to}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-slate-200 bg-white">
        <div className="shell flex flex-col gap-4 py-8 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <p>© {currentYear} MyCloudAI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a className="transition hover:text-action" href="/sitemap.xml" target="_blank" rel="noreferrer">
              Sitemap
            </a>
            <a className="transition hover:text-action" href="https://github.com/mycloudai/value-investment-tools" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <span>MyCloudAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}