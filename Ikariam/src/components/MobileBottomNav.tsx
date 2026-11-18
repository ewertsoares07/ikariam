import React, { useState } from 'react';
import {
  Anchor,
  Axe,
  Bell,
  Building2,
  Calculator,
  Eye,
  FileText,
  Home,
  LayoutGrid,
  Menu,
  Package,
  Shield,
  Swords,
  Volume2,
  X,
} from 'lucide-react';
import { useImperial } from '../context/ImperialContext';
import { TabId } from '../types/ikariam';

const LEFT_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'inicio', label: 'Início', icon: <Home className="h-5 w-5" /> },
  { id: 'edificios', label: 'Edifícios', icon: <Building2 className="h-5 w-5" /> },
];

const RIGHT_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'recursos', label: 'Recursos', icon: <Package className="h-5 w-5" /> },
  { id: 'militar', label: 'Militar', icon: <Swords className="h-5 w-5" /> },
];

const MORE_TABS: { id: TabId; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'vikings', label: 'Vikings', desc: 'Aldeias bárbaras por ilha', icon: <Axe className="h-5 w-5" /> },
  { id: 'simulador', label: 'Simulador', desc: 'Linhas, moral, ouro & muralha', icon: <Shield className="h-5 w-5" /> },
  { id: 'pirataria', label: 'Pirataria', desc: 'Missões & fortaleza', icon: <Anchor className="h-5 w-5" /> },
  { id: 'espionagem', label: 'Espionagem', desc: 'Alvos & saque de 20%', icon: <Eye className="h-5 w-5" /> },
  { id: 'calculadoras', label: 'Calculadoras', desc: 'Viagem, rotas & 8 milagres', icon: <Calculator className="h-5 w-5" /> },
  { id: 'notas', label: 'Notas & Nuvem', desc: 'Firebase, JSON & anotações', icon: <FileText className="h-5 w-5" /> },
];

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    wineUrgencyList,
    obrasFila,
    timers,
    now,
    setPanoramaOpen,
    setSoundboardOpen,
    requestNotifications,
    notificationPermission,
  } = useImperial();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const criticalWine = wineUrgencyList.filter((w) => w.status === 'critical').length;
  const completedObras = obrasFila.filter((o) => o.termino <= now).length;
  const activeTimers = timers.filter((t) => t.termino > now).length;
  const isMoreTabActive = MORE_TABS.some((t) => t.id === activeTab);

  const selectFromDrawer = (tab: TabId) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  const renderPrimaryButton = (tab: { id: TabId; label: string; icon: React.ReactNode }) => {
    const isActive = activeTab === tab.id && !drawerOpen;
    let dotText = '';
    if (tab.id === 'recursos' && criticalWine > 0) dotText = String(criticalWine);
    else if (tab.id === 'edificios' && completedObras > 0) dotText = String(completedObras);
    else if (tab.id === 'militar' && activeTimers > 0) dotText = String(activeTimers);

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => {
          setDrawerOpen(false);
          setActiveTab(tab.id);
        }}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-bold transition ${
          isActive
            ? 'text-[#1b4b6b] dark:text-[#f2cc60]'
            : 'text-[#7d6b56] hover:text-[#24190e] dark:text-[#8b949e] dark:hover:text-white'
        }`}
      >
        {isActive && (
          <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-[#1b4b6b] dark:bg-[#f2cc60]" />
        )}
        <div className="relative">
          {tab.icon}
          {dotText && (
            <span className="font-mono-num absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-extrabold text-white">
              {dotText}
            </span>
          )}
        </div>
        <span className="truncate whitespace-nowrap">{tab.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Bottom Sheet Drawer for Secondary Modules */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute right-0 bottom-0 left-0 rounded-t-3xl border-t border-[#dcc8a6] bg-[#fffdf8] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] shadow-2xl dark:border-[#2d3440] dark:bg-[#161b22]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#dcc8a6] dark:bg-[#30363d]" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-extrabold tracking-wide text-[#24190e] uppercase dark:text-[#f0f6fc]">
                Menu de Módulos Imperiais
              </h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-[#5c4835] dark:bg-white/10 dark:text-[#c9d1d9]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {MORE_TABS.map((item) => {
                const selected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectFromDrawer(item.id)}
                    className={`flex min-h-[58px] items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                      selected
                        ? 'border-[#1b4b6b] bg-[#1b4b6b]/10 text-[#1b4b6b] dark:border-[#e3b341] dark:bg-[#e3b341]/15 dark:text-[#f2cc60]'
                        : 'border-[#dcc8a6]/80 bg-[#f7f0e0]/50 text-[#24190e] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1b4b6b]/10 text-[#1b4b6b] dark:bg-white/5 dark:text-[#e3b341]">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold">{item.label}</div>
                      <div className="truncate text-[10px] opacity-75">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Mobile Actions */}
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#dcc8a6]/60 pt-3 dark:border-[#2d3440]">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setPanoramaOpen(true);
                }}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#dcc8a6] bg-[#fffdf8] px-2 text-xs font-bold text-[#24190e] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#f0f6fc]"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-[#c99326]" />
                <span>Panorama</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setSoundboardOpen(true);
                }}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#dcc8a6] bg-[#fffdf8] px-2 text-xs font-bold text-[#24190e] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#f0f6fc]"
              >
                <Volume2 className="h-3.5 w-3.5 text-[#1b4b6b] dark:text-[#60a5fa]" />
                <span>Sons</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  requestNotifications();
                }}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#dcc8a6] bg-[#fffdf8] px-2 text-xs font-bold text-[#24190e] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#f0f6fc]"
              >
                <Bell
                  className={`h-3.5 w-3.5 ${
                    notificationPermission === 'granted' ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                />
                <span>Alertas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Thumb-Zone Bottom Bar with Centered Menu Button */}
      <nav
        aria-label="Navegação Mobile"
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#dcc8a6] bg-[#fffdf8]/95 backdrop-blur-md md:hidden dark:border-[#2d3440] dark:bg-[#161b22]/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 items-stretch">
          {LEFT_TABS.map(renderPrimaryButton)}

          {/* Centered Menu Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-expanded={drawerOpen}
            aria-label="Abrir menu de módulos"
            className={`relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 px-1 py-1 text-[10px] font-bold transition ${
              drawerOpen || isMoreTabActive
                ? 'text-[#1b4b6b] dark:text-[#f2cc60]'
                : 'text-[#5c4835] hover:text-[#24190e] dark:text-[#c9d1d9] dark:hover:text-white'
            }`}
          >
            <span
              className={`flex h-8 w-11 items-center justify-center rounded-xl transition-transform active:scale-95 ${
                drawerOpen || isMoreTabActive
                  ? 'bg-[#1b4b6b] text-white shadow-sm dark:bg-[#c99326] dark:text-[#0d1117]'
                  : 'bg-[#1b4b6b]/12 text-[#1b4b6b] dark:bg-[#c99326]/20 dark:text-[#f2cc60]'
              }`}
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </span>
            <span className="truncate whitespace-nowrap leading-none">Menu</span>
          </button>

          {RIGHT_TABS.map(renderPrimaryButton)}
        </div>
      </nav>
    </>
  );
};
