import React, { useState } from 'react';
import { Axe, ScrollText } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import { FLEET_FREIGHTER_CAP, FLEET_FREIGHTERS, FLEET_MERCHANT_CAP, FLEET_MERCHANT_SHIPS } from '../data/gameData';
import { playWarDrums, playWarHorn } from '../services/audioService';
import { calcVikingStats } from '../utils/calculations';

export const VikingsView: React.FC = () => {
  const {
    cities,
    activeCityId,
    vikingLevels,
    setVikingLevel,
    addTimer,
    setActiveTab,
    showHudAlert,
    audioMuted,
  } = useImperial();

  const [selectedCityId, setSelectedCityId] = useState(activeCityId);
  const [cartasLvl, setCartasLvl] = useState(14);

  const nivel = vikingLevels[selectedCityId] || 10;
  const stats = calcVikingStats(nivel, cartasLvl);
  const selectedCity = cities.find((c) => c.id === selectedCityId) || cities[0];

  const nextLevels = Array.from({ length: 5 }, (_, idx) => calcVikingStats(nivel + idx, cartasLvl));

  const handleLaunchRaid = () => {
    addTimer(`Pilhagem Viking [${selectedCity.nome}] Nível ${nivel}`, stats.tempoComCartasSeg);
    playWarDrums(audioMuted);
    showHudAlert('ATAQUE VIKING LANÇADO', `Frota em marcha contra Aldeia Viking Nível ${nivel}!`, '🪓');
    setActiveTab('militar');
  };

  const handleVictory = () => {
    setVikingLevel(selectedCityId, nivel + 1);
    playWarHorn(audioMuted);
    showHudAlert('VITÓRIA VIKING REGISTRADA', 'Aldeia bárbara derrotada! Nível e recursos elevados.', '🏆');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 1. Barbarian Control */}
      <CollapsiblePanel
        title="Aldeia dos Bárbaros & Vikings por Coordenada"
        icon={<Axe className="h-4 w-4" />}
        badge={
          <span className="font-mono-num rounded-md bg-[#8a2a1f]/15 px-2 py-0.5 text-[11px] font-bold text-[#8a2a1f] dark:text-[#f87171]">
            Nível {nivel}
          </span>
        }
        defaultOpenMobile={true}
      >
        <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
          Cada colônia/coordenada possui sua própria <strong>Aldeia Viking</strong>. Escolha a cidade para ver recursos, navios necessários e defesa bárbara.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Colônia / Coordenada Local
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.coords}] {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Nível da Aldeia Viking (1 a 50)
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                min={1}
                max={50}
                value={nivel}
                onChange={(e) => setVikingLevel(selectedCityId, parseInt(e.target.value, 10) || 1)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm font-bold dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
              <button
                type="button"
                onClick={() => setVikingLevel(selectedCityId, nivel - 1)}
                className="rounded-lg bg-[#1b4b6b] px-3 py-2 text-xs font-bold text-white hover:bg-[#235d84]"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => setVikingLevel(selectedCityId, nivel + 1)}
                className="rounded-lg bg-[#1b4b6b] px-3 py-2 text-xs font-bold text-white hover:bg-[#235d84]"
              >
                +1
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Arquivo de Cartas Náuticas (0 a 32)
            </label>
            <input
              type="number"
              min={0}
              max={32}
              value={cartasLvl}
              onChange={(e) => setCartasLvl(Math.max(0, Math.min(32, parseInt(e.target.value, 10) || 0)))}
              className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Bônus de Velocidade das Cartas
            </label>
            <input
              type="text"
              readOnly
              value={`-${stats.percBonusCartas}% no tempo (${cartasLvl} Cartas)`}
              className="w-full rounded-lg border border-[#dcc8a6] bg-[#f7f0e0] px-3 py-2 text-sm font-bold text-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#60a5fa]"
            />
          </div>
        </div>

        <div className="mt-4 space-y-1.5 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
          <div className="font-extrabold text-[#24190e] dark:text-[#f2cc60]">
            ⚔️ Inteligência Militar da Aldeia Viking [Nível {stats.nivel}]:
          </div>
          <div>
            • 🪵 Madeira: <strong className="font-mono-num">{stats.madeira.toLocaleString('pt-BR')}</strong> ·
            🪙 Ouro: <strong className="font-mono-num">{stats.ouro.toLocaleString('pt-BR')}</strong> ·
            Luxo: <strong className="font-mono-num">{stats.luxo.toLocaleString('pt-BR')}</strong>
          </div>
          <div>
            • 📦 Total Saqueável:{' '}
            <strong className="font-mono-num text-sm text-[#8a2a1f] dark:text-[#f87171]">
              {stats.totalSaque.toLocaleString('pt-BR')} unidades
            </strong>
          </div>
          <div>
            • ⛵ Frota p/ Saque Total:{' '}
            <strong className="font-mono-num text-[#1b4b6b] dark:text-[#60a5fa]">
              {stats.barcos600} Mercantes (600)
            </strong>{' '}
            ou <strong className="font-mono-num">{stats.cargueiros52k} Cargueiro(s) (52k)</strong>
          </div>
          <div>
            • 🛡️ Defesa Bárbara: <strong>~{stats.barbarosTropa} Guerreiros</strong>{' '}
            {stats.temFrotaNaval ? (
              <strong className="text-red-600 dark:text-red-400">
                + {stats.barcosBarbaros} Barcos Piratas no Porto (roubo de frota marítima!)
              </strong>
            ) : (
              '(Sem frota marítima)'
            )}
          </div>
          <div>
            • 🎯 Ataque Recomendado (0 baixas):{' '}
            <strong>
              {stats.hoplitasRec} Hoplitas/Gigantes, {stats.carabineirosRec} Carabineiros, {stats.cozinheirosRec} Cozinheiros
              {stats.temFrotaNaval ? ` + ${stats.naviosGuerraRec} Lança-Chamas / Aríetes a Vapor` : ''}
            </strong>
          </div>
          <div>
            • ⏱️ Tempo de Viagem (Cartas Nível {cartasLvl}):{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {stats.tempoComCartasMin} minutos
            </strong>{' '}
            (em vez de {stats.tempoBaseMin}m)
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLaunchRaid}
            className="flex-2 min-h-[44px] rounded-xl bg-[#8a2a1f] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#a33428] sm:text-sm"
          >
            ⚔️ Lançar Pilhagem & Iniciar Cronômetro
          </button>
          <button
            type="button"
            onClick={handleVictory}
            className="flex-1 min-h-[44px] rounded-xl bg-[#1b4b6b] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#235d84] sm:text-sm"
          >
            🏆 Vitória (+1 Nível)
          </button>
        </div>
      </CollapsiblePanel>

      {/* 2. Lookahead Table */}
      <CollapsiblePanel
        title="Próximos Níveis da Aldeia Viking"
        icon={<ScrollText className="h-4 w-4" />}
        defaultOpenMobile={false}
      >
        <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
          Progressão dos próximos níveis para <strong>{selectedCity.nome} [{selectedCity.coords}]</strong>.
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#dcc8a6] dark:border-[#2d3440]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7f0e0] text-[#5c4835] dark:bg-[#1c222b] dark:text-[#f2cc60]">
              <tr>
                <th className="px-3 py-2">Nível</th>
                <th className="px-3 py-2">Recursos Totais</th>
                <th className="px-3 py-2">Merc. (600)</th>
                <th className="px-3 py-2">Carg. (52k)</th>
                <th className="px-3 py-2">Defesa Bárbara</th>
              </tr>
            </thead>
            <tbody className="font-mono-num divide-y divide-[#dcc8a6]/50 dark:divide-[#2d3440]">
              {nextLevels.map((lv, idx) => (
                <tr
                  key={lv.nivel}
                  className={
                    idx === 0
                      ? 'bg-[#c99326]/15 font-bold text-[#24190e] dark:text-white'
                      : 'bg-white dark:bg-[#161b22]'
                  }
                >
                  <td className="font-sans px-3 py-2">{idx === 0 ? `▶ Nível ${lv.nivel}` : `Nível ${lv.nivel}`}</td>
                  <td className="px-3 py-2">{lv.totalSaque.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2">{lv.barcos600} un.</td>
                  <td className="px-3 py-2">{lv.cargueiros52k} un.</td>
                  <td className="font-sans px-3 py-2">
                    {lv.barbarosTropa} vikings{lv.temFrotaNaval ? ` + ${lv.barcosBarbaros} Barcos` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/60 p-3.5 text-xs leading-relaxed text-[#5c4835] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#c9d1d9]">
          <strong className="text-[#24190e] dark:text-[#f2cc60]">🛡️ Dica de Pilhagem Bárbara:</strong>
          <ul className="mt-1 space-y-1">
            <li>
              • A partir do <strong>nível 10</strong>, os vikings passam a ter frota marítima defensora no porto. Envie navios de guerra para roubar a frota e liberar o saque!
            </li>
            <li>
              • Com <strong>{FLEET_MERCHANT_SHIPS} Barcos Mercantes ({FLEET_MERCHANT_CAP})</strong> e{' '}
              <strong>{FLEET_FREIGHTERS} Cargueiros ({FLEET_FREIGHTER_CAP.toLocaleString('pt-BR')})</strong>, você transporta até 1,59M por ataque.
            </li>
          </ul>
        </div>
      </CollapsiblePanel>
    </div>
  );
};
