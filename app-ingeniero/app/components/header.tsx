'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, GitCompare, Calculator, Briefcase, LayoutDashboard } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'FIBRAs', icon: LayoutDashboard },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/comparador', label: 'Comparador', icon: GitCompare },
  { href: '/calculadora', label: 'Calculadora', icon: Calculator },
  { href: '/portafolio', label: 'Portafolio', icon: Briefcase },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[#222]" style={{ background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-[1100px] mx-auto px-3">
        <div className="flex items-center justify-between h-[52px]">
          <Link href="/" className="flex items-center gap-1.5 select-none no-underline">
            <div className="w-2 h-2 rounded-full bg-[#e8003a] flex-shrink-0" />
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '26px', letterSpacing: '2px', color: '#f2f2f2' }}>
              FIBRAS<span className="text-[#e8003a]">.</span><span className="text-[#e8003a]">MX</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#e8003a] text-white'
                      : 'text-[#888] hover:text-[#f2f2f2] hover:bg-[#181818]'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#888] bg-[#181818] border border-[#2e2e2e] px-2.5 py-1.5 rounded-full">
            <div className="w-[7px] h-[7px] rounded-full bg-[#1D9E75] animate-pulse-dot flex-shrink-0" />
            <span className="hidden sm:inline">BMV · México</span>
            <span>🇲🇽</span>
          </div>
        </div>
      </div>
    </header>
  );
}
