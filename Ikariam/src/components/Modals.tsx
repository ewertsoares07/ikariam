import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useImperial } from '../context/ImperialContext';
import { getDefaultCityResources, OFFICIAL_UNIT_COSTS } from '../data/gameData';
import { playAlertBell, playGoldCoins, playWarDrums, playWarHorn } from '../services/audioService';
import { AlarmSoundType } from '../types/ikariam';
import { formatCoordMask } from '../utils/formatters';

export const Modals: React.FC = () => {
  const {
    cities,
    activeCity,
    activeCityId,
    setActiveCityId,
    addCity,
    resourcesMap,
    armiesMap,
    taberna,
    pesquisa,
    radarMissions,
    now,
    newCityModalOpen,
    setNewCityModalOpen,
    panoramaOpen,
    setPanoramaOpen,
    activeAdvisor,
    setActiveAdvisor,
    soundboardOpen,
    setSoundboardOpen,
    alarmSound,
    setAlarmSound,
    voiceEnabled,
    setVoiceEnabled,
    audioMuted,
    setActiveTab,
    showHudAlert,
  } = useImperial();

  const [newCityName, setNewCityName] = useState('');
  const [newCityCoords, setNewCityCoords] = useState('');

  const handleConfirmCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim() || !newCityCoords.trim()) return;
    addCity(newCityName.trim(), newCityCoords.trim());
    setNewCityName('');
    setNewCityCoords('');
    setNewCityModalOpen(false);
  };

  // Totals for Panorama
  const panoramaTotals = cities.reduce(
    (acc, c) => {
      const r = resourcesMap[c.id] || getDefaultCityResources(c.id);
      acc.madeira += r.madeira?.atual ?? 0;
      acc.vinho += r.vinho?.atual ?? 0;
      acc.marmore += r.marmore?.atual ?? 0;
      acc.cristal += r.cristal?.atual ?? 0;
      acc.enxofre += r.enxofre?.atual ?? 0;
      return acc;
    },
    { madeira: 0, vinho: 0, marmore: 0, cristal: 0, enxofre: 0 }
  );

  // Advisor calculations
  const activeRes = resourcesMap[activeCity.id] || getDefaultCityResources(activeCity.id);
  const activeArmy = armiesMap[activeCity.id] || [];
  const activeUpkeep = activeArmy.reduce(
    (acc, u) => acc + u.qtd * (OFFICIAL_UNIT_COSTS[u.nome] || u.custo || 3),
    0
  );

  return (
    <>
      {/* 1. MODAL: NOVA COLÔNIA */}
      {newCityModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setNewCityModalOpen(false)}
        >
          <form
            onSubmit={handleConfirmCity}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#dcc8a6] bg-[#fffdf8] p-5 shadow-2xl dark:border-[#2d3440] dark:bg-[#161b22]"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#dcc8a6]/60 pb-3 dark:border-[#2d3440]">
              <h3 className="font-display text-lg font-bold text-[#24190e] dark:text-[#f0f6fc]">
                Adicionar Nova Colônia Imperial
              </h3>
              <button
                type="button"
                onClick={() => setNewCityModalOpen(false)}
                className="rounded-lg p-1.5 text-[#7d6b56] hover:bg-black/5 dark:text-[#8b949e]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Nome da Cidade
                </label>
                <input
                  type="text"
                  required
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="Ex: Nova Atenas"
                  className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm text-[#24190e] outline-none focus:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#0d1117] dark:text-[#f0f6fc]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Coordenadas da Ilha (X:Y)
                </label>
                <input
                  type="text"
                  required
                  value={newCityCoords}
                  onChange={(e) => setNewCityCoords(formatCoordMask(e.target.value, newCityCoords))}
                  placeholder="Ex: 96:72"
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm text-[#24190e] outline-none focus:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#0d1117] dark:text-[#f0f6fc]"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#8a2a1f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#a33428]"
              >
                Adicionar Colônia
              </button>
              <button
                type="button"
                onClick={() => setNewCityModalOpen(false)}
                className="rounded-xl border border-[#dcc8a6] px-4 py-2.5 text-sm font-bold text-[#5c4835] hover:bg-black/5 dark:border-[#2d3440] dark:text-[#c9d1d9]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. MODAL: PANORAMA IMPERIAL (12+ CIDADES) */}
      {panoramaOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-xs sm:p-5"
          onClick={() => setPanoramaOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#dcc8a6] bg-[#fffdf8] shadow-2xl dark:border-[#2d3440] dark:bg-[#161b22]"
          >
            <div className="flex items-center justify-between border-b border-[#dcc8a6]/60 px-5 py-3.5 dark:border-[#2d3440]">
              <h3 className="font-display text-lg font-extrabold text-[#24190e] dark:text-[#f0f6fc]">
                🏛️ Panorama Imperial · Todas as Colônias ({cities.length})
              </h3>
              <button
                type="button"
                onClick={() => setPanoramaOpen(false)}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                <span>Fechar</span>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {/* Totals Callout */}
              <div className="mb-4 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0] p-3.5 text-xs leading-relaxed text-[#24190e] sm:text-sm dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#f0f6fc]">
                <div className="mb-1 font-bold text-[#8e683f] dark:text-[#f2cc60]">
                  🪙 Tesouro Consolidado ({cities.length} Cidades):
                </div>
                <div className="font-mono-num flex flex-wrap gap-x-4 gap-y-1">
                  <span>🪵 Madeira: <strong>{Math.floor(panoramaTotals.madeira).toLocaleString('pt-BR')}</strong></span>
                  <span>🍇 Vinho: <strong>{Math.floor(panoramaTotals.vinho).toLocaleString('pt-BR')}</strong></span>
                  <span>🏛️ Mármore: <strong>{Math.floor(panoramaTotals.marmore).toLocaleString('pt-BR')}</strong></span>
                  <span>💎 Cristal: <strong>{Math.floor(panoramaTotals.cristal).toLocaleString('pt-BR')}</strong></span>
                  <span>🔥 Enxofre: <strong>{Math.floor(panoramaTotals.enxofre).toLocaleString('pt-BR')}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((c) => {
                  const r = resourcesMap[c.id] || getDefaultCityResources(c.id);
                  const isCurrent = c.id === activeCityId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setActiveCityId(c.id);
                        setPanoramaOpen(false);
                        showHudAlert('COLÔNIA ATIVADA', `Você agora comanda ${c.nome} [${c.coords}]`, '🏛️');
                      }}
                      className={`rounded-xl border p-3.5 text-left transition ${
                        isCurrent
                          ? 'border-[#c99326] bg-[#c99326]/10 ring-1 ring-[#c99326]'
                          : 'border-[#dcc8a6] bg-white hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:hover:border-[#e3b341]'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <strong className="font-display text-sm text-[#24190e] dark:text-[#f0f6fc]">
                          🏛️ {c.nome} {c.capital ? '👑' : ''}
                        </strong>
                        <span className="font-mono-num text-xs font-bold text-[#7d6b56] dark:text-[#8b949e]">
                          [{c.coords}]
                        </span>
                      </div>
                      <div className="font-mono-num grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
                        <span>🪵 {Math.floor(r.madeira.atual).toLocaleString('pt-BR')}</span>
                        <span>🍇 {Math.floor(r.vinho.atual).toLocaleString('pt-BR')}</span>
                        <span>🏛️ {Math.floor(r.marmore.atual).toLocaleString('pt-BR')}</span>
                        <span>💎 {Math.floor(r.cristal.atual).toLocaleString('pt-BR')}</span>
                        <span>🔥 {Math.floor(r.enxofre.atual).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
                        ➜ Toque para comandar esta colônia
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Matrix Table */}
              <div className="mt-6 border-t border-[#dcc8a6] pt-4 dark:border-[#2d3440]">
                <h4 className="font-display mb-2.5 text-sm font-bold text-[#24190e] dark:text-[#f0f6fc]">
                  📊 Matriz Consolidada de Produção & Renda
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[#dcc8a6] dark:border-[#2d3440]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f7f0e0] text-[#5c4835] dark:bg-[#1c222b] dark:text-[#f2cc60]">
                      <tr>
                        <th className="px-3 py-2">Colônia</th>
                        <th className="px-3 py-2">Coords</th>
                        <th className="px-3 py-2">🪵/h</th>
                        <th className="px-3 py-2">🍇/h</th>
                        <th className="px-3 py-2">🏛️/h</th>
                        <th className="px-3 py-2">💎/h</th>
                        <th className="px-3 py-2">🔥/h</th>
                        <th className="px-3 py-2">Balanço Ouro</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono-num divide-y divide-[#dcc8a6]/50 dark:divide-[#2d3440]">
                      {cities.map((c) => {
                        const r = resourcesMap[c.id] || getDefaultCityResources(c.id);
                        const army = armiesMap[c.id] || [];
                        const upkeep = army.reduce(
                          (acc, u) => acc + u.qtd * (OFFICIAL_UNIT_COSTS[u.nome] || u.custo || 3),
                          0
                        );
                        const goldBal = 3200 * 3 - 120 * 6 - upkeep;
                        return (
                          <tr key={c.id} className="bg-white dark:bg-[#161b22]">
                            <td className="font-sans px-3 py-2 font-bold text-[#24190e] dark:text-white">
                              {c.nome} {c.capital ? '👑' : ''}
                            </td>
                            <td className="px-3 py-2 text-[#7d6b56] dark:text-[#8b949e]">[{c.coords}]</td>
                            <td className="px-3 py-2">+{r.madeira.prod.toLocaleString('pt-BR')}</td>
                            <td className="px-3 py-2">+{r.vinho.prod.toLocaleString('pt-BR')}</td>
                            <td className="px-3 py-2">+{r.marmore.prod.toLocaleString('pt-BR')}</td>
                            <td className="px-3 py-2">+{r.cristal.prod.toLocaleString('pt-BR')}</td>
                            <td className="px-3 py-2">+{r.enxofre.prod.toLocaleString('pt-BR')}</td>
                            <td
                              className={`px-3 py-2 font-bold ${
                                goldBal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {goldBal >= 0 ? '+' : ''}
                              {goldBal.toLocaleString('pt-BR')} o/h
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: OS 4 CONSELHEIROS */}
      {activeAdvisor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setActiveAdvisor(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-[#dcc8a6] bg-[#fffdf8] p-5 shadow-2xl dark:border-[#2d3440] dark:bg-[#161b22]"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#dcc8a6]/60 pb-3 dark:border-[#2d3440]">
              <h3 className="font-display text-base font-extrabold text-[#24190e] dark:text-[#f0f6fc]">
                {activeAdvisor === 'cidades' && '🏛️ Conselheiro de Cidades (Prefeito)'}
                {activeAdvisor === 'militar' && '⚔️ Conselheiro Militar (General)'}
                {activeAdvisor === 'pesquisa' && '🏗️ Conselheiro de Obras & Academia'}
                {activeAdvisor === 'diplomacia' && '📜 Conselheiro Diplomático (Embaixador)'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveAdvisor(null)}
                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white"
              >
                ✕
              </button>
            </div>

            {activeAdvisor === 'cidades' && (
              <div className="space-y-3 text-sm text-[#24190e] dark:text-[#f0f6fc]">
                <div className="rounded-xl border border-[#dcc8a6] bg-[#f7f0e0] p-3.5 leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
                  <strong>Relatório de Governo · {activeCity.nome} [{activeCity.coords}]</strong>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                    <li>• Reserva de Vinho: <strong className="font-mono-num">{Math.floor(activeRes.vinho.atual).toLocaleString('pt-BR')} L</strong></li>
                    <li>
                      • Consumo Taberna: <strong className="font-mono-num">{taberna.consumo} L/h</strong> (Autonomia:{' '}
                      <strong className="font-mono-num text-[#1b4b6b] dark:text-[#60a5fa]">
                        {taberna.consumo > 0 ? (activeRes.vinho.atual / taberna.consumo).toFixed(1) : '∞'}h
                      </strong>)
                    </li>
                    <li>• Status Geral: <strong className="text-emerald-600 dark:text-emerald-400">Monitoramento em tempo real ativo</strong></li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdvisor(null);
                      setActiveTab('recursos');
                    }}
                    className="flex-1 rounded-xl bg-[#8a2a1f] py-2.5 text-xs font-bold text-white"
                  >
                    📦 Gerenciar Armazéns
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdvisor(null);
                      setPanoramaOpen(true);
                    }}
                    className="flex-1 rounded-xl bg-[#1b4b6b] py-2.5 text-xs font-bold text-white"
                  >
                    🏛️ Ver {cities.length} Colônias
                  </button>
                </div>
              </div>
            )}

            {activeAdvisor === 'militar' && (
              <div className="space-y-3 text-sm text-[#24190e] dark:text-[#f0f6fc]">
                <div className="rounded-xl border border-[#dcc8a6] bg-[#f7f0e0] p-3.5 leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
                  <strong>Relatório de Alto Comando · {activeCity.nome}</strong>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                    <li>
                      • Soldados Terrestres:{' '}
                      <strong className="font-mono-num text-[#8a2a1f] dark:text-[#dc5b4a]">
                        {activeArmy
                          .filter((u) => u.tipo !== 'Naval')
                          .reduce((a, b) => a + b.qtd, 0)
                          .toLocaleString('pt-BR')}{' '}
                        homens
                      </strong>
                    </li>
                    <li>
                      • Frotas Navais:{' '}
                      <strong className="font-mono-num text-[#1b4b6b] dark:text-[#60a5fa]">
                        {activeArmy
                          .filter((u) => u.tipo === 'Naval')
                          .reduce((a, b) => a + b.qtd, 0)
                          .toLocaleString('pt-BR')}{' '}
                        navios
                      </strong>
                    </li>
                    <li>
                      • Custo de Manutenção:{' '}
                      <strong className="font-mono-num">{activeUpkeep.toLocaleString('pt-BR')} Ouro/h</strong>
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdvisor(null);
                      setActiveTab('militar');
                    }}
                    className="flex-1 rounded-xl bg-[#8a2a1f] py-2.5 text-xs font-bold text-white"
                  >
                    ⚔️ Quartel & Alarmes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdvisor(null);
                      setActiveTab('simulador');
                    }}
                    className="flex-1 rounded-xl bg-[#1b4b6b] py-2.5 text-xs font-bold text-white"
                  >
                    🛡️ Ir para Simulador
                  </button>
                </div>
              </div>
            )}

            {activeAdvisor === 'pesquisa' && (
              <div className="space-y-3 text-sm text-[#24190e] dark:text-[#f0f6fc]">
                <div className="rounded-xl border border-[#dcc8a6] bg-[#f7f0e0] p-3.5 leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
                  <strong>Obras & Conhecimento Imperial</strong>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                    <li>• Pesquisa Referência: <strong>{pesquisa.nome}</strong></li>
                    <li>• Produção Científica: <strong className="font-mono-num">{pesquisa.prod} RP/h</strong></li>
                    <li>• Tempo Estimado: <strong className="font-mono-num">{(pesquisa.total / Math.max(1, pesquisa.prod)).toFixed(1)} horas</strong></li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAdvisor(null);
                    setActiveTab('edificios');
                  }}
                  className="w-full rounded-xl bg-[#1b4b6b] py-2.5 text-xs font-bold text-white"
                >
                  🏗️ Abrir Edifícios & Fila de Obras
                </button>
              </div>
            )}

            {activeAdvisor === 'diplomacia' && (
              <div className="space-y-3 text-sm text-[#24190e] dark:text-[#f0f6fc]">
                <div className="rounded-xl border border-[#dcc8a6] bg-[#f7f0e0] p-3.5 leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
                  <strong>Gabinete Diplomático & Frotas</strong>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                    <li>
                      • Frotas em Alto-Mar:{' '}
                      <strong className="font-mono-num">
                        {radarMissions.filter((m) => m.inicio + m.duracaoSeg * 1000 > now).length} missões ativas
                      </strong>
                    </li>
                    <li>• Pactos & Notas: <strong className="text-emerald-600 dark:text-emerald-400">Sincronizados na nuvem</strong></li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdvisor(null);
                      setActiveTab('calculadoras');
                    }}
                    className="flex-1 rounded-xl bg-[#8a2a1f] py-2.5 text-xs font-bold text-white"
                  >
                    ⛵ Calculadoras & Rotas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdvisor(null);
                      setActiveTab('notas');
                    }}
                    className="flex-1 rounded-xl bg-[#1b4b6b] py-2.5 text-xs font-bold text-white"
                  >
                    📝 Notas & Nuvem
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL: SOUNDBOARD & VOZ */}
      {soundboardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setSoundboardOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#dcc8a6] bg-[#fffdf8] p-5 shadow-2xl dark:border-[#2d3440] dark:bg-[#161b22]"
          >
            <div className="mb-3 flex items-center justify-between border-b border-[#dcc8a6]/60 pb-3 dark:border-[#2d3440]">
              <h3 className="font-display text-base font-bold text-[#24190e] dark:text-[#f0f6fc]">
                🔊 Sons de Guerra & Voz (Web Audio)
              </h3>
              <button
                type="button"
                onClick={() => setSoundboardOpen(false)}
                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white"
              >
                ✕
              </button>
            </div>

            <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
              Todos os efeitos são gerados pelo próprio navegador, funcionando 100% offline.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => playWarHorn(audioMuted)}
                className="rounded-xl bg-[#8a2a1f] py-2.5 text-xs font-bold text-white hover:bg-[#a33428]"
              >
                🎺 Corneta
              </button>
              <button
                type="button"
                onClick={() => playWarDrums(audioMuted)}
                className="rounded-xl bg-[#1b4b6b] py-2.5 text-xs font-bold text-white hover:bg-[#235d84]"
              >
                🥁 Tambores
              </button>
              <button
                type="button"
                onClick={() => playAlertBell(audioMuted)}
                className="rounded-xl bg-[#9c6f28] py-2.5 text-xs font-bold text-white hover:bg-[#b07e2f]"
              >
                🔔 Sino de Alerta
              </button>
              <button
                type="button"
                onClick={() => playGoldCoins(audioMuted)}
                className="rounded-xl bg-[#b58925] py-2.5 text-xs font-bold text-white hover:bg-[#c9992b]"
              >
                🪙 Moedas de Ouro
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Som Padrão ao Concluir Obras & Cronômetros
                </label>
                <select
                  value={alarmSound}
                  onChange={(e) => setAlarmSound(e.target.value as AlarmSoundType)}
                  className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm text-[#24190e] dark:border-[#2d3440] dark:bg-[#0d1117] dark:text-[#f0f6fc]"
                >
                  <option value="corneta">🎺 Corneta de Guerra Espartana</option>
                  <option value="tambor">🥁 Tambores de Marcha</option>
                  <option value="sino">🔔 Sino de Alerta da Cidade</option>
                  <option value="moedas">🪙 Chocalho de Moedas de Ouro</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#24190e] dark:text-[#f0f6fc]">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#1b4b6b]"
                />
                Ativar anúncio por voz sintetizada em Português
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
