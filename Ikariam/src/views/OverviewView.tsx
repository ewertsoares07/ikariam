import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Axe,
  Bell,
  Building2,
  Clock,
  Package,
  Ship,
  Swords,
  Wine,
} from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import { calcVikingStats } from '../utils/calculations';
import { formatCompactResource, formatCountdown, formatHoursToReadable } from '../utils/formatters';

export const OverviewView: React.FC = () => {
  const {
    now,
    cities,
    activeCity,
    wineUrgencyList,
    obrasFila,
    timers,
    radarMissions,
    vikingLevels,
    notificationPermission,
    requestNotifications,
    setActiveTab,
    triggerPrefillRoute,
    liveProdActive,
  } = useImperial();

  const urgentWines = wineUrgencyList.filter((w) => w.status !== 'safe');
  const displayWines = urgentWines.length > 0 ? urgentWines.slice(0, 5) : wineUrgencyList.slice(0, 4);

  const sortedObras = [...obrasFila].sort((a, b) => a.termino - b.termino);
  const activeTimers = timers.filter((t) => t.termino > now);
  const expiredTimers = timers.filter((t) => t.termino <= now);
  const activeRadar = radarMissions.filter((m) => m.inicio + m.duracaoSeg * 1000 > now);

  const vikingLvl = vikingLevels[activeCity.id] || 10;
  const vikingStats = calcVikingStats(vikingLvl, 14);

  const handleSupplyWine = (destId: string, qty: number) => {
    const fallbackOrigin = cities.find((c) => c.id !== destId)?.id || activeCity.id;
    triggerPrefillRoute({
      origemId: activeCity.id !== destId ? activeCity.id : fallbackOrigin,
      destinoId: destId,
      recurso: 'Vinho',
      quantidade: Math.max(600, qty),
    });
  };

  return (
    <div className="space-y-4">
      {/* Notification Permission Nudge Banner (only if default/not granted yet) */}
      {notificationPermission === 'default' && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#c99326]/50 bg-[#c99326]/10 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5 sm:items-center">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[#c99326] sm:mt-0" />
            <div className="text-xs text-[#24190e] dark:text-[#f0f6fc]">
              <strong>Notificações do Sistema Desativadas:</strong> Ative para receber alertas nativos no celular ou PC quando suas obras ou ataques terminarem.
            </div>
          </div>
          <button
            type="button"
            onClick={requestNotifications}
            className="shrink-0 rounded-lg bg-[#1b4b6b] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#235d84]"
          >
            🔔 Ativar Alertas
          </button>
        </div>
      )}

      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('recursos')}
          className="rounded-xl border border-[#dcc8a6] bg-[#fffdf8] p-3.5 text-left transition hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#161b22] dark:hover:border-[#e3b341]"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#7d6b56] dark:text-[#8b949e]">
            <span>Urgências de Vinho</span>
            <Wine className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="font-mono-num mt-1.5 text-xl font-extrabold text-[#24190e] dark:text-white">
            {urgentWines.length}{' '}
            <span className="text-xs font-semibold text-[#7d6b56] dark:text-[#8b949e]">
              / {cities.length} cidades
            </span>
          </div>
          <div className="mt-1 truncate text-[11px] text-[#5c4835] dark:text-[#c9d1d9]">
            {wineUrgencyList[0]
              ? `1ª: ${wineUrgencyList[0].cidade.nome} (${formatHoursToReadable(wineUrgencyList[0].horasRestantes)})`
              : 'Todas abastecidas'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('edificios')}
          className="rounded-xl border border-[#dcc8a6] bg-[#fffdf8] p-3.5 text-left transition hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#161b22] dark:hover:border-[#e3b341]"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#7d6b56] dark:text-[#8b949e]">
            <span>Fila de Obras</span>
            <Building2 className="h-4 w-4 text-[#c99326]" />
          </div>
          <div className="font-mono-num mt-1.5 text-xl font-extrabold text-[#24190e] dark:text-white">
            {sortedObras.length}{' '}
            <span className="text-xs font-semibold text-[#7d6b56] dark:text-[#8b949e]">em fila</span>
          </div>
          <div className="font-mono-num mt-1 truncate text-[11px] text-[#5c4835] dark:text-[#c9d1d9]">
            {sortedObras[0]
              ? sortedObras[0].termino <= now
                ? `✔ ${sortedObras[0].edificio} concluída!`
                : `Próx: ${formatCountdown((sortedObras[0].termino - now) / 1000)}`
              : 'Nenhuma obra cadastrada'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('militar')}
          className="rounded-xl border border-[#dcc8a6] bg-[#fffdf8] p-3.5 text-left transition hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#161b22] dark:hover:border-[#e3b341]"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#7d6b56] dark:text-[#8b949e]">
            <span>Timers & Radar</span>
            <Swords className="h-4 w-4 text-[#8a2a1f] dark:text-[#dc5b4a]" />
          </div>
          <div className="font-mono-num mt-1.5 text-xl font-extrabold text-[#24190e] dark:text-white">
            {activeTimers.length + activeRadar.length}{' '}
            <span className="text-xs font-semibold text-[#7d6b56] dark:text-[#8b949e]">ativos</span>
          </div>
          <div className="mt-1 truncate text-[11px] text-[#5c4835] dark:text-[#c9d1d9]">
            {expiredTimers.length > 0
              ? `${expiredTimers.length} evento(s) concluído(s)`
              : `${activeRadar.length} frota(s) em alto-mar`}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vikings')}
          className="rounded-xl border border-[#dcc8a6] bg-[#fffdf8] p-3.5 text-left transition hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#161b22] dark:hover:border-[#e3b341]"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#7d6b56] dark:text-[#8b949e]">
            <span>Viking · {activeCity.nome}</span>
            <Axe className="h-4 w-4 text-[#1b4b6b] dark:text-[#60a5fa]" />
          </div>
          <div className="font-mono-num mt-1.5 text-xl font-extrabold text-[#24190e] dark:text-white">
            Nível {vikingLvl}
          </div>
          <div className="font-mono-num mt-1 truncate text-[11px] text-[#5c4835] dark:text-[#c9d1d9]">
            Saque: {formatCompactResource(vikingStats.totalSaque)} ({vikingStats.barcos600} barcos)
          </div>
        </button>
      </div>

      {/* Main 2-column Priority Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Wine Urgency Summary */}
        <CollapsiblePanel
          title="Urgências de Vinho (Abastecimento Prioritário)"
          icon={<Wine className="h-4 w-4" />}
          badge={
            <button
              type="button"
              onClick={() => setActiveTab('recursos')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1b4b6b] hover:underline dark:text-[#60a5fa]"
            >
              <span>Ver todas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
          defaultOpenMobile={true}
        >
          <div className="space-y-2">
            {displayWines.map((item, idx) => {
              const isCrit = item.status === 'critical';
              const isWarn = item.status === 'warning';
              return (
                <div
                  key={item.cidade.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                    isCrit
                      ? 'border-red-300 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/30'
                      : isWarn
                      ? 'border-amber-300 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25'
                      : 'border-[#dcc8a6]/70 bg-[#f7f0e0]/50 dark:border-[#2d3440] dark:bg-[#1c222b]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono-num text-xs font-extrabold ${
                          isCrit
                            ? 'text-red-600 dark:text-red-400'
                            : isWarn
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <strong className="truncate text-sm text-[#24190e] dark:text-white">
                        {item.cidade.nome}
                      </strong>
                      <span className="font-mono-num text-[11px] text-[#7d6b56] dark:text-[#8b949e]">
                        [{item.cidade.coords}]
                      </span>
                    </div>
                    <div className="font-mono-num mt-0.5 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
                      Estoque: <strong>{Math.floor(item.vinhoAtual).toLocaleString('pt-BR')} L</strong> ·
                      Autonomia:{' '}
                      <strong
                        className={
                          isCrit
                            ? 'text-red-600 dark:text-red-400'
                            : isWarn
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {formatHoursToReadable(item.horasRestantes)}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSupplyWine(item.cidade.id, item.vinho7Dias)}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#1b4b6b] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#235d84]"
                  >
                    <Ship className="h-3.5 w-3.5" />
                    <span>Abastecer</span>
                  </button>
                </div>
              );
            })}
          </div>
        </CollapsiblePanel>

        {/* 2. Next Building Completions */}
        <CollapsiblePanel
          title="Próximas Obras a Concluir"
          icon={<Building2 className="h-4 w-4" />}
          badge={
            <button
              type="button"
              onClick={() => setActiveTab('edificios')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1b4b6b] hover:underline dark:text-[#60a5fa]"
            >
              <span>Gerenciar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
          defaultOpenMobile={true}
        >
          {sortedObras.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7d6b56] dark:text-[#8b949e]">
              Nenhuma obra cadastrada na fila imperial.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedObras.slice(0, 5).map((obra) => {
                const remSec = Math.max(0, Math.floor((obra.termino - now) / 1000));
                const done = remSec === 0;
                return (
                  <div
                    key={obra.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                      done
                        ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : 'border-[#dcc8a6]/70 bg-[#f7f0e0]/50 dark:border-[#2d3440] dark:bg-[#1c222b]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <strong className="truncate text-sm text-[#24190e] dark:text-white">
                          {obra.edificio} ➔ Nível {obra.nivelAlvo}
                        </strong>
                        <span className="text-xs font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
                          [{obra.cidadeId}]
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7d6b56] dark:text-[#8b949e]">
                        {done
                          ? '✔ Construção finalizada!'
                          : `Término às ${new Date(obra.termino).toLocaleTimeString('pt-BR')}`}
                      </div>
                    </div>

                    <span
                      className={`font-mono-num shrink-0 rounded-lg border px-2.5 py-1 text-xs font-extrabold ${
                        done
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-[#8a2a1f]/25 bg-[#8a2a1f]/10 text-[#8a2a1f] dark:border-[#dc5b4a]/30 dark:text-[#f87171]'
                      }`}
                    >
                      {formatCountdown(remSec)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsiblePanel>
      </div>

      {/* Bottom Row: Active Timers & Quick Diagnostics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CollapsiblePanel
          title="Cronômetros & Missões em Curso"
          icon={<Clock className="h-4 w-4" />}
          badge={
            <button
              type="button"
              onClick={() => setActiveTab('militar')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1b4b6b] hover:underline dark:text-[#60a5fa]"
            >
              <span>Abrir Militar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
          defaultOpenMobile={false}
        >
          {timers.length === 0 && radarMissions.length === 0 ? (
            <div className="py-5 text-center text-xs text-[#7d6b56] dark:text-[#8b949e]">
              Nenhum cronômetro ou frota em deslocamento no momento.
            </div>
          ) : (
            <div className="space-y-2">
              {timers.slice(0, 4).map((t) => {
                const remSec = Math.max(0, Math.floor((t.termino - now) / 1000));
                const done = remSec === 0;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#dcc8a6]/70 bg-[#f7f0e0]/40 px-3 py-2 dark:border-[#2d3440] dark:bg-[#1c222b]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[#24190e] dark:text-white">{t.nome}</div>
                      <div className="text-[11px] text-[#7d6b56] dark:text-[#8b949e]">
                        {done ? '⚠️ Concluído' : `Previsto: ${new Date(t.termino).toLocaleTimeString('pt-BR')}`}
                      </div>
                    </div>
                    <span className="font-mono-num shrink-0 text-xs font-extrabold text-[#8a2a1f] dark:text-[#f87171]">
                      {formatCountdown(remSec)}
                    </span>
                  </div>
                );
              })}

              {radarMissions.slice(0, 3).map((m) => {
                const elapsed = Math.max(0, Math.floor((now - m.inicio) / 1000));
                const remSec = Math.max(0, m.duracaoSeg - elapsed);
                const perc = Math.min(100, Math.round((elapsed / Math.max(1, m.duracaoSeg)) * 100));
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[#dcc8a6]/70 bg-[#f7f0e0]/40 px-3 py-2 dark:border-[#2d3440] dark:bg-[#1c222b]"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <strong className="truncate text-[#24190e] dark:text-white">⛵ {m.alvo}</strong>
                      <span className="font-mono-num font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
                        {remSec === 0 ? 'Chegou' : formatCountdown(remSec)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-black/35">
                      <div className="h-full rounded-full bg-[#c99326]" style={{ width: `${perc}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Ações Rápidas do Comandante"
          icon={<AlertTriangle className="h-4 w-4" />}
          defaultOpenMobile={false}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('vikings')}
              className="flex min-h-[52px] items-center gap-2 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/50 px-3 py-2 text-left text-xs font-bold text-[#24190e] transition hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-white"
            >
              <Axe className="h-4 w-4 shrink-0 text-[#8a2a1f] dark:text-[#f87171]" />
              <span>Calcular Pilhagem Viking</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recursos')}
              className="flex min-h-[52px] items-center gap-2 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/50 px-3 py-2 text-left text-xs font-bold text-[#24190e] transition hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-white"
            >
              <Package className="h-4 w-4 shrink-0 text-[#1b4b6b] dark:text-[#60a5fa]" />
              <span>Editar Estoques ({liveProdActive ? 'Ao Vivo ON' : 'Pausado'})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('edificios')}
              className="flex min-h-[52px] items-center gap-2 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/50 px-3 py-2 text-left text-xs font-bold text-[#24190e] transition hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-white"
            >
              <Building2 className="h-4 w-4 shrink-0 text-[#c99326]" />
              <span>Nova Obra / Meta</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculadoras')}
              className="flex min-h-[52px] items-center gap-2 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/50 px-3 py-2 text-left text-xs font-bold text-[#24190e] transition hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-white"
            >
              <Ship className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Rota & Tempo de Viagem</span>
            </button>
          </div>
        </CollapsiblePanel>
      </div>
    </div>
  );
};
