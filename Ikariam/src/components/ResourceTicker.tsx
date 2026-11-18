import React, { useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useImperial } from '../context/ImperialContext';
import {
  FLEET_FREIGHTER_CAP,
  FLEET_FREIGHTERS,
  FLEET_MERCHANT_CAP,
  FLEET_MERCHANT_SHIPS,
  FLEET_TOTAL_CAP,
  getDefaultCityResources,
  OFFICIAL_UNIT_COSTS,
  RESOURCE_META,
} from '../data/gameData';
import { ResourceKey } from '../types/ikariam';
import { formatCompactResource } from '../utils/formatters';

export const ResourceTicker: React.FC = () => {
  const {
    cities,
    activeCity,
    resourcesMap,
    armiesMap,
    tickerMode,
    toggleTickerMode,
    globalGold,
    setActiveTab,
  } = useImperial();

  const summary = useMemo(() => {
    const totals: Record<ResourceKey, { atual: number; max: number }> = {
      madeira: { atual: 0, max: 0 },
      vinho: { atual: 0, max: 0 },
      marmore: { atual: 0, max: 0 },
      cristal: { atual: 0, max: 0 },
      enxofre: { atual: 0, max: 0 },
    };
    let totOuroHora = 0;
    let totalCidadaos = 0;

    if (tickerMode === 'cidade') {
      const res = resourcesMap[activeCity.id] || getDefaultCityResources(activeCity.id);
      (['madeira', 'vinho', 'marmore', 'cristal', 'enxofre'] as ResourceKey[]).forEach((k) => {
        totals[k].atual = res[k]?.atual ?? 0;
        totals[k].max = res[k]?.max ?? 1;
      });
      const army = armiesMap[activeCity.id] || [];
      const upkeep = army.reduce((acc, u) => acc + u.qtd * (OFFICIAL_UNIT_COSTS[u.nome] || u.custo || 3), 0);
      totOuroHora = 3200 * 3 - 120 * 6 - upkeep;
      totalCidadaos = 3200;
    } else {
      cities.forEach((c) => {
        const res = resourcesMap[c.id] || getDefaultCityResources(c.id);
        (['madeira', 'vinho', 'marmore', 'cristal', 'enxofre'] as ResourceKey[]).forEach((k) => {
          totals[k].atual += res[k]?.atual ?? 0;
          totals[k].max += res[k]?.max ?? 1;
        });
        const army = armiesMap[c.id] || [];
        const upkeep = army.reduce((acc, u) => acc + u.qtd * (OFFICIAL_UNIT_COSTS[u.nome] || u.custo || 3), 0);
        totOuroHora += 2800 * 3 - 80 * 6 - upkeep;
        totalCidadaos += 2800;
      });
    }

    return { totals, totOuroHora, totalCidadaos };
  }, [tickerMode, activeCity.id, resourcesMap, armiesMap, cities]);

  return (
    <div className="border-t border-white/10 bg-[#0d2333]/90 px-3 py-2.5 sm:px-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wide text-[#f2cc60] uppercase">
          {tickerMode === 'cidade'
            ? `🏛️ Colônia: ${activeCity.nome}`
            : `🌐 Império Consolidado (${cities.length} Cidades)`}
        </span>
        <button
          type="button"
          onClick={toggleTickerMode}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20"
        >
          <ArrowLeftRight className="h-3 w-3" />
          <span>{tickerMode === 'cidade' ? `Ver Império (${cities.length})` : 'Ver Cidade Ativa'}</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8 sm:gap-2">
        {(['madeira', 'vinho', 'marmore', 'cristal', 'enxofre'] as ResourceKey[]).map((key) => {
          const meta = RESOURCE_META[key];
          const item = summary.totals[key];
          const perc = Math.min(100, Math.round((item.atual / Math.max(1, item.max)) * 100));
          const barColor = perc >= 95 ? '#ef4444' : perc >= 80 ? '#f59e0b' : meta.barHex;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab('recursos')}
              className="flex flex-col justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left transition hover:bg-white/10"
              title={`${meta.label}: ${Math.floor(item.atual).toLocaleString('pt-BR')} (${perc}% do armazém)`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">{meta.icone}</span>
                <div className="min-w-0">
                  <div className="font-mono-num truncate text-xs font-bold text-white sm:text-sm">
                    {formatCompactResource(item.atual)}
                  </div>
                  <div className="truncate text-[10px] text-white/65">{meta.label}</div>
                </div>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${perc}%`, backgroundColor: barColor }}
                />
              </div>
            </button>
          );
        })}

        {/* Gold */}
        <div
          className="flex flex-col justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-1.5"
          title={`Tesouro de Ouro: ${globalGold.toLocaleString('pt-BR')}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">🪙</span>
            <div className="min-w-0">
              <div className="font-mono-num truncate text-xs font-bold text-[#f2cc60] sm:text-sm">
                {formatCompactResource(globalGold)}
              </div>
              <div
                className={`font-mono-num truncate text-[10px] font-semibold ${
                  summary.totOuroHora >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {summary.totOuroHora >= 0 ? '+' : ''}
                {summary.totOuroHora.toLocaleString('pt-BR')}/h
              </div>
            </div>
          </div>
        </div>

        {/* Fleet */}
        <div
          className="flex flex-col justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-1.5"
          title={`${FLEET_MERCHANT_SHIPS} Barcos Mercantes (cap. ${FLEET_MERCHANT_CAP}) + ${FLEET_FREIGHTERS} Cargueiros (cap. ${FLEET_FREIGHTER_CAP.toLocaleString('pt-BR')})`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">⛵</span>
            <div className="min-w-0">
              <div className="font-mono-num truncate text-[11px] font-bold text-white sm:text-xs">
                {FLEET_MERCHANT_SHIPS}M · {FLEET_FREIGHTERS}C
              </div>
              <div className="truncate text-[10px] text-white/65">
                Cap: {formatCompactResource(FLEET_TOTAL_CAP)}
              </div>
            </div>
          </div>
        </div>

        {/* Citizens */}
        <div className="flex flex-col justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">👥</span>
            <div className="min-w-0">
              <div className="font-mono-num truncate text-[11px] font-bold text-white sm:text-xs">
                {formatCompactResource(summary.totalCidadaos)}
              </div>
              <div className="truncate text-[10px] text-white/65">Livres</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
