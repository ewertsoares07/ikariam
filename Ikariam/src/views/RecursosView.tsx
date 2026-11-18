import React from 'react';
import { Package, Ship, Wine, Zap } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import { getDefaultCityResources, RESOURCE_META } from '../data/gameData';
import { ResourceKey } from '../types/ikariam';
import { formatHoursToReadable, formatNumberDots, parseCleanNumber } from '../utils/formatters';

export const RecursosView: React.FC = () => {
  const {
    cities,
    activeCity,
    resourcesMap,
    updateCityResource,
    liveProdActive,
    setLiveProdActive,
    taberna,
    setTabernaData,
    wineUrgencyList,
    triggerPrefillRoute,
  } = useImperial();

  const cityRes = resourcesMap[activeCity.id] || getDefaultCityResources(activeCity.id);

  // Warehouse overflow diagnosis
  let hasAlert = false;
  const diagItems = (['madeira', 'vinho', 'marmore', 'cristal', 'enxofre'] as ResourceKey[]).map((k) => {
    const entry = cityRes[k];
    const falta = entry.max - entry.atual;
    const perc = Math.min(100, Math.round((entry.atual / Math.max(1, entry.max)) * 100));
    if (falta <= 0) {
      hasAlert = true;
      return {
        key: k,
        tone: 'danger' as const,
        text: `${RESOURCE_META[k].label.toUpperCase()}: ARMAZÉM LOTADO (${perc}%) — Produção desperdiçada!`,
      };
    }
    if (entry.prod > 0) {
      const horasRestantes = falta / entry.prod;
      if (horasRestantes < 6) {
        hasAlert = true;
        return {
          key: k,
          tone: 'warn' as const,
          text: `${RESOURCE_META[k].label.toUpperCase()}: ${perc}% lotado — Lotará em ${horasRestantes.toFixed(1)} horas!`,
        };
      }
      return {
        key: k,
        tone: 'normal' as const,
        text: `${RESOURCE_META[k].label.toUpperCase()}: ${perc}% ocupado (${horasRestantes.toFixed(1)}h até lotar)`,
      };
    }
    return {
      key: k,
      tone: 'normal' as const,
      text: `${RESOURCE_META[k].label.toUpperCase()}: ${perc}% da capacidade ocupada`,
    };
  });

  const vinhoAtual = cityRes.vinho.atual;
  const horasVinho = taberna.consumo > 0 ? vinhoAtual / taberna.consumo : Infinity;
  const diasVinho = Number.isFinite(horasVinho) ? Math.floor(horasVinho / 24) : 0;
  const horasRestVinho = Number.isFinite(horasVinho) ? Math.floor(horasVinho % 24) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Left: Stocks & Warehouses */}
      <CollapsiblePanel
        title={`Estoque & Armazéns (${activeCity.nome})`}
        icon={<Package className="h-4 w-4" />}
        badge={
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#1b4b6b]/25 bg-[#1b4b6b]/10 px-2.5 py-1 text-[11px] font-bold text-[#1b4b6b] dark:border-[#60a5fa]/30 dark:bg-[#3b82b6]/15 dark:text-[#60a5fa]">
            <input
              type="checkbox"
              checked={liveProdActive}
              onChange={(e) => setLiveProdActive(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#1b4b6b]"
            />
            <Zap className="h-3 w-3" />
            <span>Tempo Real</span>
          </label>
        }
        defaultOpenMobile={true}
      >
        <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
          Digite números com formatação automática de milhar (<code>2.000</code>, <code>110.000.000</code>). Com Tempo Real ativo, o estoque sobe continuamente conforme a produção/hora.
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#dcc8a6] dark:border-[#2d3440]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#f7f0e0] text-[#5c4835] dark:bg-[#1c222b] dark:text-[#f2cc60]">
              <tr>
                <th className="px-3 py-2.5">Recurso</th>
                <th className="px-2 py-2.5">Estoque Atual</th>
                <th className="px-2 py-2.5">Cap. Máx</th>
                <th className="px-2 py-2.5">Prod./Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dcc8a6]/60 dark:divide-[#2d3440]">
              {(['madeira', 'vinho', 'marmore', 'cristal', 'enxofre'] as ResourceKey[]).map((key) => {
                const meta = RESOURCE_META[key];
                const entry = cityRes[key];
                return (
                  <tr key={key} className="bg-white dark:bg-[#161b22]">
                    <td className="px-3 py-2 font-bold whitespace-nowrap">
                      <span className="mr-1.5">{meta.icone}</span>
                      {meta.label}
                    </td>
                    <td className="px-1.5 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberDots(Math.floor(entry.atual))}
                        onChange={(e) =>
                          updateCityResource(activeCity.id, key, 'atual', parseCleanNumber(e.target.value))
                        }
                        className="font-mono-num w-24 rounded-lg border border-[#dcc8a6] bg-[#fffdf8] px-2 py-1.5 text-xs font-bold sm:w-28 dark:border-[#2d3440] dark:bg-[#0d1117]"
                      />
                    </td>
                    <td className="px-1.5 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberDots(Math.floor(entry.max))}
                        onChange={(e) =>
                          updateCityResource(activeCity.id, key, 'max', parseCleanNumber(e.target.value))
                        }
                        className="font-mono-num w-24 rounded-lg border border-[#dcc8a6] bg-[#fffdf8] px-2 py-1.5 text-xs sm:w-28 dark:border-[#2d3440] dark:bg-[#0d1117]"
                      />
                    </td>
                    <td className="px-1.5 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberDots(Math.floor(entry.prod))}
                        onChange={(e) =>
                          updateCityResource(activeCity.id, key, 'prod', parseCleanNumber(e.target.value))
                        }
                        className="font-mono-num w-20 rounded-lg border border-[#dcc8a6] bg-[#fffdf8] px-2 py-1.5 text-xs sm:w-24 dark:border-[#2d3440] dark:bg-[#0d1117]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
          <div className="mb-1.5 font-extrabold text-[#24190e] dark:text-[#f2cc60]">
            📦 Diagnóstico de Armazenamento:
          </div>
          <div className="space-y-0.5">
            {diagItems.map((d) => (
              <div
                key={d.key}
                className={
                  d.tone === 'danger'
                    ? 'font-bold text-red-600 dark:text-red-400'
                    : d.tone === 'warn'
                    ? 'font-bold text-amber-700 dark:text-amber-400'
                    : 'text-[#5c4835] dark:text-[#c9d1d9]'
                }
              >
                • {d.text}
              </div>
            ))}
            {!hasAlert && (
              <div className="pt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                ✔ Todos os armazéns operando com margem segura.
              </div>
            )}
          </div>
        </div>
      </CollapsiblePanel>

      {/* Right Column: Tavern & Wine Urgency */}
      <div className="space-y-4">
        <CollapsiblePanel
          title="Taberna & Satisfação da População"
          icon={<Wine className="h-4 w-4" />}
          defaultOpenMobile={false}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Nível da Taberna
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={taberna.nivel}
                onChange={(e) => setTabernaData({ ...taberna, nivel: parseInt(e.target.value, 10) || 1 })}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Servir Vinho (Litros/h)
              </label>
              <input
                type="number"
                min={0}
                value={taberna.consumo}
                onChange={(e) => setTabernaData({ ...taberna, consumo: parseFloat(e.target.value) || 0 })}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
            {taberna.consumo <= 0 ? (
              <span>Consumo zerado. A taberna não está gastando vinho no momento.</span>
            ) : (
              <>
                <div>
                  Consumo Atual: <strong className="font-mono-num">{taberna.consumo} litros/hora</strong>
                </div>
                <div>
                  Estoque Disponível:{' '}
                  <strong className="font-mono-num">{Math.floor(vinhoAtual).toLocaleString('pt-BR')} litros</strong>
                </div>
                <div>
                  Autonomia:{' '}
                  <strong
                    className={`font-mono-num ${
                      horasVinho < 12 ? 'text-red-600 dark:text-red-400' : 'text-[#1b4b6b] dark:text-[#60a5fa]'
                    }`}
                  >
                    {diasVinho} dias e {horasRestVinho} horas
                  </strong>{' '}
                  antes do vinho esgotar!
                </div>
              </>
            )}
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title={`Urgência de Vinho (${cities.length} Cidades)`}
          icon={<Wine className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
          badge={
            <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:text-red-300">
              Prioridade
            </span>
          }
          defaultOpenMobile={true}
        >
          <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
            Colônias ordenadas pelo menor tempo restante de vinho. Use <strong>Abastecer</strong> para preparar a rota marítima automaticamente.
          </p>

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {wineUrgencyList.map((item, idx) => {
              const isCrit = item.status === 'critical';
              const isWarn = item.status === 'warning';
              const fallbackOrigin = cities.find((c) => c.id !== item.cidade.id)?.id || activeCity.id;

              return (
                <div
                  key={item.cidade.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                    isCrit
                      ? 'border-red-300 bg-red-50/75 dark:border-red-900/60 dark:bg-red-950/30'
                      : isWarn
                      ? 'border-amber-300 bg-amber-50/75 dark:border-amber-900/60 dark:bg-amber-950/25'
                      : 'border-[#dcc8a6] bg-[#f7f0e0]/50 dark:border-[#2d3440] dark:bg-[#1c222b]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-extrabold ${
                          isCrit
                            ? 'text-red-600 dark:text-red-400'
                            : isWarn
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {idx + 1}º {isCrit ? '🚨 URGENTE' : isWarn ? '⚠️ ATENÇÃO' : '🟢 ESTÁVEL'}
                      </span>
                      <strong className="truncate text-sm text-[#24190e] dark:text-white">
                        {item.cidade.nome}
                      </strong>
                      <span className="font-mono-num text-[11px] text-[#7d6b56] dark:text-[#8b949e]">
                        [{item.cidade.coords}]
                      </span>
                    </div>
                    <div className="font-mono-num mt-0.5 text-[11px] text-[#5c4835] dark:text-[#c9d1d9]">
                      Estoque: <strong>{Math.floor(item.vinhoAtual).toLocaleString('pt-BR')} L</strong> ·
                      Consumo: <strong>{item.consumoTaberna} L/h</strong>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono-num text-xs font-extrabold ${
                        isCrit
                          ? 'text-red-600 dark:text-red-400'
                          : isWarn
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatHoursToReadable(item.horasRestantes)} restante
                    </div>
                    <div className="font-mono-num text-[10px] text-[#7d6b56] dark:text-[#8b949e]">
                      7d: {Math.floor(item.vinho7Dias).toLocaleString('pt-BR')} L ({item.barcosNecessarios} barcos)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      triggerPrefillRoute({
                        origemId: activeCity.id !== item.cidade.id ? activeCity.id : fallbackOrigin,
                        destinoId: item.cidade.id,
                        recurso: 'Vinho',
                        quantidade: Math.max(600, Math.round(item.vinho7Dias)),
                      })
                    }
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-[#1b4b6b] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#235d84]"
                  >
                    <Ship className="h-3.5 w-3.5" />
                    <span>Abastecer</span>
                  </button>
                </div>
              );
            })}
          </div>
        </CollapsiblePanel>
      </div>
    </div>
  );
};
