import React, { useEffect, useRef } from 'react';
import { ImperialProvider, useImperial } from './context/ImperialContext';
import { Header } from './components/Header';
import { DesktopTabNav } from './components/DesktopTabNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HudAlertBanner } from './components/HudAlertBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Modals } from './components/Modals';
import { OverviewView } from './views/OverviewView';
import { EdificiosView } from './views/EdificiosView';
import { RecursosView } from './views/RecursosView';
import { MilitarView } from './views/MilitarView';
import { VikingsView } from './views/VikingsView';
import { SimuladorView } from './views/SimuladorView';
import { PiratariaView } from './views/PiratariaView';
import { EspionagemView } from './views/EspionagemView';
import { CalculadorasView } from './views/CalculadorasView';
import { NotasBackupView } from './views/NotasBackupView';
import { TabId } from './types/ikariam';

const PRIMARY_SWIPE_TABS: { id: TabId; label: string }[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'edificios', label: 'Edifícios' },
  { id: 'recursos', label: 'Recursos' },
  { id: 'militar', label: 'Militar' },
];

function isSwipeBlockedTarget(target: EventTarget | null, boundary: HTMLElement | null): boolean {
  let el = target as HTMLElement | null;
  while (el && el !== boundary) {
    const tag = el.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(tag)) return true;
    if (el.getAttribute('data-no-swipe') === 'true') return true;
    if (el.scrollWidth > el.clientWidth + 8) {
      const style = window.getComputedStyle(el);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

const ImperialShell: React.FC = () => {
  const { activeTab, setActiveTab, tabTransitionDir, tabChangeSeq, triggerAccordionAll } = useImperial();
  const tabAnchorRef = useRef<HTMLDivElement | null>(null);
  const swipeAreaRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number; blocked: boolean } | null>(null);

  // Scroll smartly to the top of the tab bar / view content only when out of view
  useEffect(() => {
    if (tabChangeSeq === 0) return;
    const anchor = tabAnchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    if (rect.top < 6 || rect.top > window.innerHeight * 0.52) {
      window.scrollTo({
        top: Math.max(0, window.scrollY + rect.top - 8),
        behavior: 'smooth',
      });
    }
  }, [tabChangeSeq]);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      blocked: isSwipeBlockedTarget(e.target, swipeAreaRef.current),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || start.blocked || e.changedTouches.length !== 1) return;

    const primaryIndex = PRIMARY_SWIPE_TABS.findIndex((t) => t.id === activeTab);
    if (primaryIndex === -1) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = Date.now() - start.time;

    if (elapsed > 650) return;
    if (Math.abs(dx) < 56) return;
    if (Math.abs(dx) <= Math.abs(dy) * 1.6) return;

    if (dx < 0 && primaryIndex < PRIMARY_SWIPE_TABS.length - 1) {
      setActiveTab(PRIMARY_SWIPE_TABS[primaryIndex + 1].id);
    } else if (dx > 0 && primaryIndex > 0) {
      setActiveTab(PRIMARY_SWIPE_TABS[primaryIndex - 1].id);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'inicio':
        return <OverviewView />;
      case 'edificios':
        return <EdificiosView />;
      case 'recursos':
        return <RecursosView />;
      case 'militar':
        return <MilitarView />;
      case 'vikings':
        return <VikingsView />;
      case 'simulador':
        return <SimuladorView />;
      case 'pirataria':
        return <PiratariaView />;
      case 'espionagem':
        return <EspionagemView />;
      case 'calculadoras':
        return <CalculadorasView />;
      case 'notas':
        return <NotasBackupView />;
      default:
        return <OverviewView />;
    }
  };

  const animationClass =
    tabTransitionDir === 'right'
      ? 'animate-tab-from-right'
      : tabTransitionDir === 'left'
      ? 'animate-tab-from-left'
      : 'animate-fade-in';

  const isPrimaryTab = PRIMARY_SWIPE_TABS.some((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      <OfflineIndicator />
      <HudAlertBanner />

      <div className="mx-auto max-w-[1380px] px-2.5 pt-2.5 sm:px-4 sm:pt-4">
        <Header />

        <div ref={tabAnchorRef}>
          <DesktopTabNav />
        </div>

        <main
          ref={swipeAreaRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="pt-2.5 pb-safe-nav sm:pt-4"
        >
          {/* Mobile swipe status & accordion quick bar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs shadow-xs md:hidden">
            {isPrimaryTab ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-secondary)]">Deslize</span>
                <div className="flex items-center" aria-label="Indicador de abas principais">
                  {PRIMARY_SWIPE_TABS.map((t) => {
                    const active = t.id === activeTab;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        aria-label={`Ir para ${t.label}`}
                        className="flex min-h-[32px] min-w-[22px] items-center justify-center px-0.5"
                      >
                        <span
                          className={`block h-2 rounded-full transition-all ${
                            active
                              ? 'w-5 bg-[#1b4b6b] dark:bg-[#e3b341]'
                              : 'w-2 bg-[#dcc8a6] dark:bg-[#30363d]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <span className="font-semibold text-[var(--text-secondary)]">
                Toque no título para expandir
              </span>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => triggerAccordionAll('expand')}
                className="min-h-[32px] rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-800 transition hover:bg-amber-500/20 dark:text-amber-300"
              >
                Abrir Todos
              </button>
              <button
                type="button"
                onClick={() => triggerAccordionAll('collapse')}
                className="min-h-[32px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 font-semibold text-[var(--text-secondary)] transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Recolher
              </button>
            </div>
          </div>

          <div key={activeTab} className={animationClass}>
            {renderActiveView()}
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <Modals />
    </div>
  );
};

export default function App() {
  return (
    <ImperialProvider>
      <ImperialShell />
    </ImperialProvider>
  );
}
