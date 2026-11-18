import React from 'react';
import {
  Bell,
  BellRing,
  Cloud,
  LayoutGrid,
  Moon,
  Plus,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useImperial } from '../context/ImperialContext';
import { OFFICIAL_UNIT_COSTS } from '../data/gameData';
import { AdvisorType } from '../types/ikariam';
import { PWAInstallButton } from './PWAInstallButton';
import { ResourceTicker } from './ResourceTicker';

export const Header: React.FC = () => {
  const {
    now,
    cities,
    activeCityId,
    setActiveCityId,
    activeCity,
    armiesMap,
    timers,
    obrasFila,
    radarMissions,
    wineUrgencyList,
    cloudStatus,
    theme,
    toggleTheme,
    audioMuted,
    toggleAudioMuted,
    setSoundboardOpen,
    setNewCityModalOpen,
    setPanoramaOpen,
    setActiveAdvisor,
    notificationPermission,
    requestNotifications,
    setActiveTab,
  } = useImperial();

  const currentTimeStr = new Date(now).toLocaleTimeString('pt-BR');
  const activeTimersCount = timers.filter((t) => t.termino > now).length;
  const activeObrasCount = obrasFila.filter((o) => o.termino > now).length;
  const activeRadarCount = radarMissions.filter((m) => m.inicio + m.duracaoSeg * 1000 > now).length;
  const activeCityArmy = armiesMap[activeCity.id] || [];
  const cityUpkeep = activeCityArmy.reduce(
    (acc, u) => acc + u.qtd * (OFFICIAL_UNIT_COSTS[u.nome] || u.custo || 3),
    0
  );
  const criticalWineCount = wineUrgencyList.filter((w) => w.status === 'critical').length;

  const cloudPill = (() => {
    if (cloudStatus === 'saving' || cloudStatus === 'loading')
      return { text: 'Salvando...', cls: 'border-amber-400/50 bg-amber-500/20 text-amber-200' };
    if (cloudStatus === 'synced')
      return { text: 'Nuvem OK', cls: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200' };
    if (cloudStatus === 'error')
      return { text: 'Erro Nuvem', cls: 'border-red-400/50 bg-red-500/20 text-red-200' };
    return { text: 'Local / Nuvem', cls: 'border-white/20 bg-white/10 text-white/80' };
  })();

  const advisors: { id: AdvisorType; title: string; avatar: string; status: string; alert?: boolean }[] = [
    {
      id: 'cidades',
      title: 'Cidades',
      avatar: '🏛️',
      status: criticalWineCount > 0 ? `${criticalWineCount} vinho crítico` : 'Armazéns Seguros',
      alert: criticalWineCount > 0,
    },
    {
      id: 'militar',
      title: 'Militar',
      avatar: '⚔️',
      status: activeTimersCount > 0 ? `${activeTimersCount} timer(s) ativo(s)` : 'Guarnição Alerta',
      alert: activeTimersCount > 0,
    },
    {
      id: 'pesquisa',
      title: 'Obras & Acad.',
      avatar: '🏗️',
      status: activeObrasCount > 0 ? `${activeObrasCount} obra(s) em fila` : 'Fila Livre',
    },
    {
      id: 'diplomacia',
      title: 'Diplomacia',
      avatar: '📜',
      status: activeRadarCount > 0 ? `${activeRadarCount} frota(s) em rota` : 'Rotas Livres',
    },
  ];

  return (
    <header className="overflow-hidden rounded-2xl border border-[#8e683f]/60 bg-gradient-to-br from-[#163a52] via-[#1b4b6b] to-[#0d2333] text-white shadow-lg dark:border-[#947144]/50 dark:from-[#141c26] dark:via-[#111822] dark:to-[#0d1117]">
      <div className="hellenic-meander-line" />

      {/* Top Row: Brand + Controls */}
      <div className="flex flex-col gap-3 px-3.5 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icon.svg"
              alt="Ikariam"
              className="h-10 w-10 shrink-0 rounded-xl border border-[#e3b341]/50 shadow-sm sm:h-11 sm:w-11"
            />
            <div className="min-w-0">
              <h1 className="font-display truncate text-base font-extrabold tracking-tight text-[#f2cc60] sm:text-xl">
                Ikariam · Painel Imperial
              </h1>
              <p className="truncate text-[11px] text-white/75 sm:text-xs">
                Comando de Colônias, Vinho, Obras & Frota em Tempo Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 lg:hidden">
            <span className="font-mono-num rounded-md bg-black/25 px-2 py-1 text-[11px] font-bold text-[#f2cc60]">
              {currentTimeStr}
            </span>
          </div>
        </div>

        {/* City Selector & Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* City Picker */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-white/15 bg-black/25 p-1 sm:flex-initial">
            <select
              value={activeCityId}
              onChange={(e) => setActiveCityId(e.target.value)}
              aria-label="Selecionar Colônia Ativa"
              className="min-h-[36px] max-w-[190px] truncate rounded-lg bg-transparent px-2 text-xs font-bold text-white outline-none sm:text-sm"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#161b22] text-white">
                  [{c.coords}] {c.nome}
                  {c.capital ? ' (Capital)' : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setNewCityModalOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              title="Adicionar Nova Colônia"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setPanoramaOpen(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-[#c99326]/90 px-2.5 text-xs font-bold text-white transition hover:bg-[#c99326]"
              title="Panorama das 12 Cidades"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Panorama ({cities.length})</span>
            </button>
          </div>

          {/* Utility Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('notas')}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition ${cloudPill.cls}`}
              title="Status Firebase Cloud (myikariamlog21)"
            >
              <Cloud className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{cloudPill.text}</span>
            </button>

            <PWAInstallButton compact />

            {notificationPermission !== 'unsupported' && (
              <button
                type="button"
                onClick={requestNotifications}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition ${
                  notificationPermission === 'granted'
                    ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
                title={
                  notificationPermission === 'granted'
                    ? 'Notificações do sistema ativas'
                    : 'Ativar notificações do sistema para obras e cronômetros'
                }
              >
                {notificationPermission === 'granted' ? (
                  <BellRing className="h-3.5 w-3.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {notificationPermission === 'granted' ? 'Alertas ON' : 'Alertas'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleAudioMuted}
              onContextMenu={(e) => {
                e.preventDefault();
                setSoundboardOpen(true);
              }}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              title={audioMuted ? 'Reativar Sons' : 'Silenciar Sons'}
            >
              {audioMuted ? <VolumeX className="h-4 w-4 text-red-300" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setSoundboardOpen(true)}
              className="hidden h-[38px] items-center rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:inline-flex"
              title="Configurar Cornetas & Voz"
            >
              🎺 Sons
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 sm:w-auto sm:gap-1.5 sm:px-2.5"
              title="Alternar tema Papiro / Mármore Noturno"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-[#f2cc60]" />
                  <span className="hidden text-xs font-semibold sm:inline">Clássico</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span className="hidden text-xs font-semibold sm:inline">Noturno</span>
                </>
              )}
            </button>

            <span className="font-mono-num hidden rounded-lg border border-white/15 bg-black/25 px-2.5 py-2 text-xs font-bold text-[#f2cc60] lg:inline-block">
              {currentTimeStr}
            </span>
          </div>
        </div>
      </div>

      {/* Live Resource & Fleet Ticker */}
      <ResourceTicker />

      {/* Advisors & Quick Imperial Metrics */}
      <div className="flex flex-col gap-2 border-t border-white/10 bg-black/20 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
          {advisors.map((adv) => (
            <button
              key={adv.id}
              type="button"
              onClick={() => setActiveAdvisor(adv.id)}
              className="relative flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-left transition hover:bg-white/15"
            >
              <span className="text-base leading-none">{adv.avatar}</span>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#f2cc60]">{adv.title}</div>
                <div className="truncate text-[10px] text-white/75">{adv.status}</div>
              </div>
              {adv.alert && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-400" />
              )}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-4 text-xs text-white/80 xl:flex">
          <span>
            Colônia: <strong className="text-white">{activeCity.nome} [{activeCity.coords}]</strong>
          </span>
          <span>
            Manutenção:{' '}
            <strong className="font-mono-num text-[#f2cc60]">
              {cityUpkeep.toLocaleString('pt-BR')} Ouro/h
            </strong>
          </span>
          <span>
            Cronômetros: <strong className="font-mono-num text-white">{activeTimersCount}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
