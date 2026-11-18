import React, { useMemo, useState } from 'react';
import { Clock, Copy, Plus, Radar, Shield, Swords, Trash2 } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import {
  getUnitIcon,
  OFFICIAL_UNIT_COSTS,
  SELECTOR_UNIT_ORDER,
  UNIT_CATALOG,
} from '../data/gameData';
import { ArmyUnit } from '../types/ikariam';
import { formatCountdown } from '../utils/formatters';

export const MilitarView: React.FC = () => {
  const {
    now,
    activeCity,
    timers,
    addTimer,
    removeTimer,
    armiesMap,
    updateCityArmy,
    radarMissions,
    addRadarMission,
    removeRadarMission,
    showHudAlert,
  } = useImperial();

  // Timers state
  const [timerName, setTimerName] = useState('');
  const [timerH, setTimerH] = useState(0);
  const [timerM, setTimerM] = useState(15);
  const [timerS, setTimerS] = useState(0);

  // Garrison state
  const [catFilter, setCatFilter] = useState<'Todos' | 'Terrestre' | 'Naval'>('Todos');
  const [selectedUnitName, setSelectedUnitName] = useState('Hoplita');
  const [unitQtyInput, setUnitQtyInput] = useState(100);

  // Radar state
  const [radarTarget, setRadarTarget] = useState('');
  const [radarType, setRadarType] = useState('Ataque / Pilhagem');
  const [radarMin, setRadarMin] = useState(25);
  const [radarShips, setRadarShips] = useState(30);

  const cityArmy = armiesMap[activeCity.id] || [];

  const sortedFilteredArmy = useMemo(() => {
    return cityArmy
      .filter((u) => (catFilter === 'Todos' ? true : u.tipo === catFilter))
      .sort((a, b) => {
        const ia = SELECTOR_UNIT_ORDER.indexOf(a.nome);
        const ib = SELECTOR_UNIT_ORDER.indexOf(b.nome);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
  }, [cityArmy, catFilter]);

  const totalUpkeep = cityArmy.reduce((acc, u) => acc + u.qtd * u.custo, 0);
  const totalHomens = cityArmy.filter((u) => u.tipo !== 'Naval').reduce((a, b) => a + b.qtd, 0);
  const totalNavios = cityArmy.filter((u) => u.tipo === 'Naval').reduce((a, b) => a + b.qtd, 0);

  const selectedCatalogItem = UNIT_CATALOG.find((u) => u.nome === selectedUnitName) || UNIT_CATALOG[0];
  const previewUpkeep = (unitQtyInput || 0) * selectedCatalogItem.custo;

  const handleStartTimer = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeg = (timerH || 0) * 3600 + (timerM || 0) * 60 + (timerS || 0);
    if (totalSeg <= 0) return;
    addTimer(timerName.trim() || 'Ataque / Movimentação', totalSeg);
    setTimerName('');
  };

  const handleFilterChange = (cat: 'Todos' | 'Terrestre' | 'Naval') => {
    setCatFilter(cat);
    if (cat === 'Terrestre' && selectedCatalogItem.tipo === 'Naval') {
      setSelectedUnitName('Hoplita');
    } else if (cat === 'Naval' && selectedCatalogItem.tipo !== 'Naval') {
      setSelectedUnitName('Trireme');
    }
  };

  const handleAddOrUpdateUnit = () => {
    const qty = Math.max(0, unitQtyInput || 0);
    if (qty <= 0) return;
    const cat = selectedCatalogItem;
    const existing = cityArmy.find((u) => u.nome === cat.nome);
    let nextList: ArmyUnit[];
    if (existing) {
      nextList = cityArmy.map((u) =>
        u.nome === cat.nome ? { ...u, qtd: qty, custo: cat.custo, tipo: cat.tipo } : u
      );
    } else {
      nextList = [
        ...cityArmy,
        { id: Date.now(), nome: cat.nome, tipo: cat.tipo, qtd: qty, custo: cat.custo },
      ];
    }
    updateCityArmy(activeCity.id, nextList);
    showHudAlert(
      'GUARNIÇÃO ATUALIZADA',
      `${qty} ${cat.nome} registrados (${(qty * cat.custo).toLocaleString('pt-BR')} Ouro/h)`,
      '🛡️'
    );
  };

  const handleDirectQty = (id: number, newVal: number) => {
    const clean = Math.max(0, Math.floor(newVal) || 0);
    const next = cityArmy.map((u) => (u.id === id ? { ...u, qtd: clean } : u));
    updateCityArmy(activeCity.id, next);
  };

  const handleStepQty = (id: number, delta: number) => {
    const next = cityArmy
      .map((u) => (u.id === id ? { ...u, qtd: Math.max(0, u.qtd + delta) } : u))
      .filter((u) => u.qtd > 0);
    updateCityArmy(activeCity.id, next);
  };

  const handleRemoveUnit = (id: number) => {
    updateCityArmy(
      activeCity.id,
      cityArmy.filter((u) => u.id !== id)
    );
  };

  const handleCopyGarrison = () => {
    if (cityArmy.length === 0) return;
    let txt = `🏛️ **GUARNIÇÃO IMPERIAL · ${activeCity.nome} [${activeCity.coords}]**\n`;
    const ter = cityArmy.filter((u) => u.tipo !== 'Naval');
    const nav = cityArmy.filter((u) => u.tipo === 'Naval');

    if (ter.length > 0) {
      txt += `\n🛡️ **TROPAS TERRESTRES:**\n`;
      ter.forEach((t) => {
        txt += `• ${getUnitIcon(t.nome)} ${t.nome}: ${t.qtd.toLocaleString('pt-BR')} (Total: ${(
          t.qtd * t.custo
        ).toLocaleString('pt-BR')} ouro/h)\n`;
      });
    }
    if (nav.length > 0) {
      txt += `\n⚓ **FROTA NAVAL:**\n`;
      nav.forEach((n) => {
        txt += `• ${getUnitIcon(n.nome)} ${n.nome}: ${n.qtd.toLocaleString('pt-BR')} (Total: ${(
          n.qtd * n.custo
        ).toLocaleString('pt-BR')} ouro/h)\n`;
      });
    }
    txt += `\n🪙 **CUSTO TOTAL:** ${totalUpkeep.toLocaleString('pt-BR')} Ouro/hora`;

    navigator.clipboard
      .writeText(txt)
      .then(() => {
        showHudAlert('COPIADO COM SUCESSO', 'Relatório militar copiado para área de transferência!', '📋');
      })
      .catch(() => {});
  };

  const handleLaunchRadar = (e: React.FormEvent) => {
    e.preventDefault();
    addRadarMission(radarTarget.trim() || 'Missão Naval', radarType, radarMin || 20, radarShips || 25);
    setRadarTarget('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. War Timers */}
        <CollapsiblePanel
          title="Cronômetros de Guerra & Alarmes"
          icon={<Clock className="h-4 w-4" />}
          badge={
            <span className="rounded-md bg-[#8a2a1f]/15 px-2 py-0.5 text-[11px] font-bold text-[#8a2a1f] dark:text-[#f87171]">
              Som + Voz + Notif
            </span>
          }
          defaultOpenMobile={true}
        >
          <form onSubmit={handleStartTimer} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Nome da Missão / Evento
              </label>
              <input
                type="text"
                value={timerName}
                onChange={(e) => setTimerName(e.target.value)}
                placeholder="Ex: Impacto em 93:24 / Retorno da Frota"
                className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Horas
                </label>
                <input
                  type="number"
                  min={0}
                  value={timerH}
                  onChange={(e) => setTimerH(parseInt(e.target.value, 10) || 0)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Minutos
                </label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={timerM}
                  onChange={(e) => setTimerM(parseInt(e.target.value, 10) || 0)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Segundos
                </label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={timerS}
                  onChange={(e) => setTimerS(parseInt(e.target.value, 10) || 0)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#7d6b56] dark:text-[#8b949e]">Atalhos:</span>
              {[
                { label: '+15m', h: 0, m: 15 },
                { label: '+30m', h: 0, m: 30 },
                { label: '+45m', h: 0, m: 45 },
                { label: '+1h', h: 1, m: 0 },
                { label: '+2h', h: 2, m: 0 },
                { label: '+4h', h: 4, m: 0 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setTimerH(p.h);
                    setTimerM(p.m);
                    setTimerS(0);
                  }}
                  className="rounded-md border border-[#dcc8a6] bg-[#f7f0e0] px-2.5 py-1 text-xs font-bold text-[#5c4835] hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#c9d1d9]"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#8a2a1f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#a33428]"
            >
              <Plus className="h-4 w-4" />
              <span>Iniciar Contagem Regressiva</span>
            </button>
          </form>

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {timers.length === 0 ? (
              <div className="py-5 text-center text-xs text-[#7d6b56] dark:text-[#8b949e]">
                Nenhum cronômetro militar ativo.
              </div>
            ) : (
              timers.map((t) => {
                const remSec = Math.max(0, Math.floor((t.termino - now) / 1000));
                const expired = remSec === 0;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                      expired
                        ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : 'border-[#dcc8a6] bg-[#f7f0e0]/50 dark:border-[#2d3440] dark:bg-[#1c222b]'
                    }`}
                  >
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-[#24190e] dark:text-white">{t.nome}</h4>
                      <p className="text-[11px] text-[#7d6b56] dark:text-[#8b949e]">
                        {expired
                          ? '⚠️ EVENTO CONCLUÍDO'
                          : `Chegada prevista: ${new Date(t.termino).toLocaleTimeString('pt-BR')}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`font-mono-num text-sm font-extrabold ${
                          expired ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#8a2a1f] dark:text-[#f87171]'
                        }`}
                      >
                        {formatCountdown(remSec)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTimer(t.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/90 text-white hover:bg-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CollapsiblePanel>

        {/* 2. Garrison */}
        <CollapsiblePanel
          title={`Guarnição em ${activeCity.nome}`}
          icon={<Shield className="h-4 w-4" />}
          badge={
            <span className="font-mono-num rounded-md bg-[#c99326]/15 px-2 py-0.5 text-[11px] font-bold text-[#8e683f] dark:text-[#f2cc60]">
              {totalUpkeep.toLocaleString('pt-BR')} Ouro/h
            </span>
          }
          defaultOpenMobile={true}
        >
          {/* Category Filters */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(['Todos', 'Terrestre', 'Naval'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleFilterChange(cat)}
                className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                  catFilter === cat
                    ? 'border-[#1b4b6b] bg-[#1b4b6b] text-white dark:border-[#c99326] dark:bg-[#c99326] dark:text-[#0d1117]'
                    : 'border-[#dcc8a6] bg-[#f7f0e0]/60 text-[#5c4835] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#c9d1d9]'
                }`}
              >
                {cat === 'Todos' && '⚔️ Todas'}
                {cat === 'Terrestre' && '🛡️ Terrestres'}
                {cat === 'Naval' && '⚓ Navais'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Unidade Ikariam
              </label>
              <select
                value={selectedUnitName}
                onChange={(e) => setSelectedUnitName(e.target.value)}
                className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              >
                {catFilter !== 'Naval' && (
                  <>
                    <optgroup label="Infantaria e Linha de Frente">
                      {UNIT_CATALOG.filter((u) => u.grupo === 'frente').map((u) => (
                        <option key={u.nome} value={u.nome}>
                          {u.icone} {u.nome}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Tiro à Distância & Aéreo">
                      {UNIT_CATALOG.filter((u) => u.grupo === 'tiro').map((u) => (
                        <option key={u.nome} value={u.nome}>
                          {u.icone} {u.nome}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Artilharia & Cerco">
                      {UNIT_CATALOG.filter((u) => u.grupo === 'artilharia').map((u) => (
                        <option key={u.nome} value={u.nome}>
                          {u.icone} {u.nome}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Suporte & Moral">
                      {UNIT_CATALOG.filter((u) => u.grupo === 'suporte').map((u) => (
                        <option key={u.nome} value={u.nome}>
                          {u.icone} {u.nome}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
                {catFilter !== 'Terrestre' && (
                  <optgroup label="Esquadra Naval">
                    {UNIT_CATALOG.filter((u) => u.grupo === 'naval').map((u) => (
                      <option key={u.nome} value={u.nome}>
                        {u.icone} {u.nome}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Quantidade
              </label>
              <input
                type="number"
                min={1}
                value={unitQtyInput}
                onChange={(e) => setUnitQtyInput(parseInt(e.target.value, 10) || 0)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
          </div>

          <div className="my-2.5 flex items-center justify-between rounded-lg border border-[#c99326]/40 bg-[#c99326]/10 px-3 py-2 text-xs">
            <span className="font-semibold text-[#5c4835] dark:text-[#c9d1d9]">🪙 Custo desta tropa:</span>
            <strong className="font-mono-num text-[#8a2a1f] dark:text-[#f2cc60]">
              {previewUpkeep.toLocaleString('pt-BR')} Ouro/h
            </strong>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddOrUpdateUnit}
              className="flex-2 min-h-[42px] rounded-xl bg-[#8a2a1f] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#a33428] sm:text-sm"
            >
              Registrar / Atualizar
            </button>
            <button
              type="button"
              onClick={handleCopyGarrison}
              className="inline-flex flex-1 min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#1b4b6b] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#235d84]"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar</span>
            </button>
          </div>

          {/* Garrison Table */}
          <div className="mt-3 max-h-72 overflow-x-auto rounded-xl border border-[#dcc8a6] dark:border-[#2d3440]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#f7f0e0] text-[#5c4835] dark:bg-[#1c222b] dark:text-[#f2cc60]">
                <tr>
                  <th className="px-2.5 py-2">Unidade</th>
                  <th className="px-2 py-2">Qtd & Baixas</th>
                  <th className="px-2 py-2">Ouro/h</th>
                  <th className="w-9 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dcc8a6]/50 dark:divide-[#2d3440]">
                {sortedFilteredArmy.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-[#7d6b56] dark:text-[#8b949e]">
                      Nenhuma unidade registrada nesta categoria.
                    </td>
                  </tr>
                ) : (
                  sortedFilteredArmy.map((u) => {
                    const cost = OFFICIAL_UNIT_COSTS[u.nome] ?? u.custo;
                    return (
                      <tr key={u.id} className="bg-white dark:bg-[#161b22]">
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-1.5">
                            <span>{getUnitIcon(u.nome)}</span>
                            <div>
                              <div className="font-bold text-[#24190e] dark:text-white">{u.nome}</div>
                              <div className="text-[10px] text-[#7d6b56] dark:text-[#8b949e]">
                                {u.tipo === 'Naval' ? '⚓ Naval' : '🛡️ Terrestre'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={u.qtd}
                              onChange={(e) => handleDirectQty(u.id, parseInt(e.target.value, 10))}
                              className="font-mono-num w-16 rounded-md border border-[#dcc8a6] bg-[#fffdf8] px-1.5 py-1 text-xs font-bold dark:border-[#2d3440] dark:bg-[#0d1117]"
                            />
                            <div className="flex gap-1">
                              {[-50, -10, 10, 50].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => handleStepQty(u.id, d)}
                                  className="rounded border border-[#dcc8a6] bg-[#f7f0e0] px-1.5 py-0.5 text-[10px] font-bold hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b]"
                                >
                                  {d > 0 ? `+${d}` : d}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="font-mono-num px-2 py-2 font-bold text-[#8a2a1f] dark:text-[#f2cc60]">
                          {(u.qtd * cost).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveUnit(u.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600/90 text-white hover:bg-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
            <strong>📊 Resumo da Guarnição:</strong> {totalHomens.toLocaleString('pt-BR')} combatentes terrestres ·{' '}
            {totalNavios.toLocaleString('pt-BR')} navios de guerra · Manutenção:{' '}
            <strong className="font-mono-num text-[#8a2a1f] dark:text-[#f2cc60]">
              {totalUpkeep.toLocaleString('pt-BR')} Ouro/h
            </strong>{' '}
            ({(totalUpkeep * 24).toLocaleString('pt-BR')}/dia).
          </div>
        </CollapsiblePanel>
      </div>

      {/* Battle Line Guide */}
      <CollapsiblePanel
        title="Disposição Tática no Campo de Batalha Ikariam"
        icon={<Swords className="h-4 w-4" />}
        defaultOpenMobile={false}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#dcc8a6]/70 bg-[#f7f0e0]/40 p-3 dark:border-[#2d3440] dark:bg-[#1c222b]">
            <strong className="text-xs text-[#8a2a1f] dark:text-[#f87171]">1ª Linha (Frente)</strong>
            <p className="mt-1 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
              <strong>Hoplitas</strong> e <strong>Gigantes a Vapor</strong> absorvem o impacto direto. Sem linha de frente, o inimigo atinge seus atiradores!
            </p>
          </div>
          <div className="rounded-xl border border-[#dcc8a6]/70 bg-[#f7f0e0]/40 p-3 dark:border-[#2d3440] dark:bg-[#1c222b]">
            <strong className="text-xs text-[#1b4b6b] dark:text-[#60a5fa]">2ª Linha & Flancos</strong>
            <p className="mt-1 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
              <strong>Carabineiros</strong> causam dano alto à distância. <strong>Espadachins</strong> nos flancos evitam cerco lateral.
            </p>
          </div>
          <div className="rounded-xl border border-[#dcc8a6]/70 bg-[#f7f0e0]/40 p-3 dark:border-[#2d3440] dark:bg-[#1c222b]">
            <strong className="text-xs text-[#c99326] dark:text-[#f2cc60]">Artilharia & Moral</strong>
            <p className="mt-1 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
              <strong>Aríetes</strong> e <strong>Morteiros</strong> derrubam muralhas. <strong>Cozinheiros</strong> mantêm a moral em 100%!
            </p>
          </div>
        </div>
      </CollapsiblePanel>

      {/* Fleet Radar */}
      <CollapsiblePanel
        title="Radar Tático de Frotas & Missões Ativas"
        icon={<Radar className="h-4 w-4" />}
        badge={
          <span className="rounded-md bg-[#1b4b6b]/10 px-2 py-0.5 text-[11px] font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
            {radarMissions.filter((m) => m.inicio + m.duracaoSeg * 1000 > now).length} em Alto-Mar
          </span>
        }
        defaultOpenMobile={false}
      >
        <form onSubmit={handleLaunchRadar} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Missão / Alvo
            </label>
            <input
              type="text"
              value={radarTarget}
              onChange={(e) => setRadarTarget(e.target.value)}
              placeholder="Ex: Pilhagem em [93:24]"
              className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Tipo
            </label>
            <select
              value={radarType}
              onChange={(e) => setRadarType(e.target.value)}
              className="w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            >
              <option value="Ataque / Pilhagem">⚔️ Ataque / Pilhagem</option>
              <option value="Transporte">📦 Transporte</option>
              <option value="Ocupação">🛡️ Ocupação</option>
              <option value="Defesa / Apoio">🤝 Apoio / Defesa</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Min
              </label>
              <input
                type="number"
                min={1}
                value={radarMin}
                onChange={(e) => setRadarMin(parseInt(e.target.value, 10) || 1)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Navios
              </label>
              <input
                type="number"
                min={1}
                value={radarShips}
                onChange={(e) => setRadarShips(parseInt(e.target.value, 10) || 1)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="min-h-[40px] w-full rounded-xl bg-[#8a2a1f] px-3 py-2 text-xs font-bold text-white hover:bg-[#a33428]"
            >
              🚀 Despachar
            </button>
          </div>
        </form>

        <div className="mt-3 space-y-2">
          {radarMissions.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#7d6b56] dark:text-[#8b949e]">
              Nenhuma missão no radar.
            </div>
          ) : (
            radarMissions.map((m) => {
              const elapsed = Math.max(0, Math.floor((now - m.inicio) / 1000));
              const perc = Math.min(100, Math.round((elapsed / Math.max(1, m.duracaoSeg)) * 100));
              const remSec = Math.max(0, m.duracaoSeg - elapsed);
              return (
                <div
                  key={m.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/50 p-3 sm:flex-row sm:items-center dark:border-[#2d3440] dark:bg-[#1c222b]"
                >
                  <div className="min-w-[160px]">
                    <strong className="text-sm text-[#24190e] dark:text-white">{m.alvo}</strong>
                    <div className="text-xs text-[#7d6b56] dark:text-[#8b949e]">
                      {m.tipo} · ⛵ {m.navios} navios
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-[11px] font-bold">
                      <span>Progresso: {perc}%</span>
                      <span className={remSec === 0 ? 'text-emerald-600' : 'text-[#8a2a1f] dark:text-[#f87171]'}>
                        {remSec === 0 ? 'Chegou ao Destino' : `Restam: ${formatCountdown(remSec)}`}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-black/40">
                      <div className="h-full rounded-full bg-[#c99326]" style={{ width: `${perc}%` }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRadarMission(m.id)}
                    className="self-end rounded-lg bg-red-600/90 p-2 text-white hover:bg-red-700 sm:self-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </CollapsiblePanel>
    </div>
  );
};
