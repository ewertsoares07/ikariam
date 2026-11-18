import React, { useEffect, useRef } from 'react';
import {
  Anchor,
  Axe,
  Building2,
  Calculator,
  Compass,
  Eye,
  FileText,
  Home,
  Package,
  Shield,
  Swords,
} from 'lucide-react';
import { useImperial } from '../context/ImperialContext';
import { TabId } from '../types/ikariam';

export const DESKTOP_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'inicio', label: 'Início', icon: <Home className="h-4 w-4 shrink-0" /> },
  { id: 'edificios', label: 'Edifícios', icon: <Building2 className="h-4 w-4 shrink-0" /> },
  { id: 'recursos', label: 'Recursos', icon: <Package className="h-4 w-4 shrink-0" /> },
  { id: 'militar', label: 'Militar', icon: <Swords className="h-4 w-4 shrink-0" /> },
  { id: 'vikings', label: 'Vikings', icon: <Axe className="h-4 w-4 shrink-0" /> },
  { id: 'simulador', label: 'Simulador', icon: <Shield className="h-4 w-4 shrink-0" /> },
  { id: 'pirataria', label: 'Pirataria', icon: <Anchor className="h-4 w-4 shrink-0" /> },
  { id: 'espionagem', label: 'Espionagem', icon: <Eye className="h-4 w-4 shrink-0" /> },
  { id: 'calculadoras', label: 'Calculadoras', icon: <Calculator className="h-4 w-4 shrink-0" /> },
  { id: 'notas', label: 'Notas & Nuvem', icon: <FileText className="h-4 w-4 shrink-0" /> },
];

export const DesktopTabNav: React.FC = () => {
  const { activeTab, setActiveTab, wineUrgencyList, obrasFila, timers, now } = useImperial();
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const buttonRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  const criticalWine = wineUrgencyList.filter((w) => w.status === 'critical').length;
  const activeObras = obrasFila.filter((o) => o.termino > now).length;
  const activeTimers = timers.filter((t) => t.termino > now).length;

  // Keep the active tab centered horizontally inside the scrollable strip without affecting vertical scroll
  useEffect(() => {
    const nav = scrollContainerRef.current;
    const btn = buttonRefs.current[activeTab];
    if (!nav || !btn) return;
    const targetLeft = btn.offsetLeft - (nav.clientWidth - btn.offsetWidth) / 2;
    nav.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, [activeTab]);

  return (
    <nav
      ref={scrollContainerRef}
      data-no-swipe="true"
      aria-label="Navegação Principal de Abas"
      className="no-scrollbar mt-3 flex flex-nowrap items-center gap-1.5 overflow-x-auto rounded-xl border border-[#dcc8a6] bg-[#fffdf8] p-1.5 shadow-xs md:mt-4 md:flex-wrap md:overflow-visible dark:border-[#2d3440] dark:bg-[#161b22]"
    >
      {DESKTOP_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        let badgeCount = 0;
        let badgeAlert = false;
        if (tab.id === 'recursos' && criticalWine > 0) {
          badgeCount = criticalWine;
          badgeAlert = true;
        } else if (tab.id === 'edificios' && activeObras > 0) {
          badgeCount = activeObras;
        } else if (tab.id === 'militar' && activeTimers > 0) {
          badgeCount = activeTimers;
        }

        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttonRefs.current[tab.id] = el;
            }}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              isActive
                ? 'bg-[#1b4b6b] text-white shadow-sm dark:bg-[#c99326] dark:text-[#0d1117]'
                : 'text-[#5c4835] hover:bg-[#f3ecdc] dark:text-[#c9d1d9] dark:hover:bg-[#1c222b]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {badgeCount > 0 && (
              <span
                className={`font-mono-num rounded-full px-1.5 py-0.5 text-[10px] leading-none font-extrabold ${
                  badgeAlert
                    ? 'bg-red-500 text-white'
                    : isActive
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#0d1117]'
                    : 'bg-[#1b4b6b]/15 text-[#1b4b6b] dark:bg-white/10 dark:text-[#e3b341]'
                }`}
              >
                {badgeCount}
              </span>
            )}
          </button>
        );
      })}
      <div className="ml-auto hidden items-center gap-1 px-2 text-[11px] font-medium whitespace-nowrap text-[#7d6b56] xl:flex dark:text-[#8b949e]">
        <Compass className="h-3.5 w-3.5" />
        <span>Painel Helênico</span>
      </div>
    </nav>
  );
};
