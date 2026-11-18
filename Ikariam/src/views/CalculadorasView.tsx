import React, { useEffect, useState } from 'react';
import { Building, Compass, PackageCheck, Ship, Sparkles } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import {
  COST_REDUCER_BUILDINGS,
  FLEET_FREIGHTERS,
  FLEET_MERCHANT_SHIPS,
  MIRACLES,
} from '../data/gameData';
import { playWarHorn, speakAlertPTBR } from '../services/audioService';
import { calcLootAndPort, calcSupplyRoute, calcTravelTime } from '../utils/calculations';
import { formatCoordMask, formatNumberDots, parseCleanNumber } from '../utils/formatters';

export const CalculadorasView: React.FC = () => {
  const {
    cities,
    activeCity,
    addTimer,
    setActiveTab,
    showHudAlert,
    audioMuted,
    voiceEnabled,
    prefillRoute,
  } = useImperial();

  // Travel calculator
  const [calcOrigem, setCalcOrigem] = useState(activeCity.coords);
  const [calcDestino, setCalcDestino] = useState('93:24');
  const [velPreset, setVelPreset] = useState('60');
  const [velValor, setVelValor] = useState(60);
  const [bonusMult, setBonusMult] = useState(1);
  const [cartasViagem, setCartasViagem] = useState(14);
  const [viagemCalculated, setViagemCalculated] = useState(false);

  // Loot & Port
  const [saqueTotalStr, setSaqueTotalStr] = useState('25.000');
  const [capMercante, setCapMercante] = useState(600);
  const [portoNivel, setPortoNivel] = useState(14);
  const [cartasPorto, setCartasPorto] = useState(14);
  const [saqueCalculated, setSaqueCalculated] = useState(false);

  // Supply Route
  const [rotaOrigemId, setRotaOrigemId] = useState(cities[0]?.id || 'SPYC');
  const [rotaDestinoId, setRotaDestinoId] = useState(cities[1]?.id || cities[0]?.id || 'CCSP');
  const [rotaRecurso, setRotaRecurso] = useState('Vinho');
  const [rotaQtdStr, setRotaQtdStr] = useState('10.000');
  const [rotaCalculated, setRotaCalculated] = useState(false);

  // Cost reducer
  const [redutorEdificio, setRedutorEdificio] = useState('Carpintaria');
  const [redutorNivel, setRedutorNivel] = useState(14);
  const [redutorCustoBaseStr, setRedutorCustoBaseStr] = useState('120.000');

  useEffect(() => {
    setCalcOrigem(activeCity.coords);
  }, [activeCity.coords]);

  // Apply prefill payloads from Wine Urgency or Espionage
  useEffect(() => {
    if (!prefillRoute) return;
    if (prefillRoute.destinoCoords) {
      setCalcDestino(prefillRoute.destinoCoords);
      setViagemCalculated(true);
    }
    if (prefillRoute.saqueTotal !== undefined) {
      setSaqueTotalStr(formatNumberDots(prefillRoute.saqueTotal));
      setSaqueCalculated(true);
    }
    if (prefillRoute.origemId) setRotaOrigemId(prefillRoute.origemId);
    if (prefillRoute.destinoId) setRotaDestinoId(prefillRoute.destinoId);
    if (prefillRoute.recurso) setRotaRecurso(prefillRoute.recurso);
    if (prefillRoute.quantidade !== undefined) {
      setRotaQtdStr(formatNumberDots(prefillRoute.quantidade));
      setRotaCalculated(true);
    }
  }, [prefillRoute]);

  const viagemRes = calcTravelTime({
    origem: calcOrigem,
    destino: calcDestino,
    velocidadeBase: velValor,
    multiplicadorBonus: bonusMult,
    cartasNauticasNivel: cartasViagem,
  });

  const saqueTotal = parseCleanNumber(saqueTotalStr);
  const portoRes = calcLootAndPort(saqueTotal, capMercante, portoNivel, cartasPorto);

  const cityOrig = cities.find((c) => c.id === rotaOrigemId) || cities[0];
  const cityDest = cities.find((c) => c.id === rotaDestinoId) || cities[1] || cities[0];
  const rotaQtd = parseCleanNumber(rotaQtdStr);
  const rotaSameCity = cityOrig.id === cityDest.id;
  const rotaRes = calcSupplyRoute(cityOrig, cityDest, rotaQtd, 14);

  const custoBase = parseCleanNumber(redutorCustoBaseStr);
  const percDesconto = Math.min(32, Math.max(0, redutorNivel));
  const economia = Math.round(custoBase * (percDesconto / 100));
  const custoFinal = custoBase - economia;

  const formatHMS = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Travel Time */}
        <CollapsiblePanel
          title="Calculadora de Viagem & Movimentação"
          icon={<Compass className="h-4 w-4" />}
          defaultOpenMobile={true}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Origem (XX:YY)
                </label>
                <input
                  type="text"
                  value={calcOrigem}
                  onChange={(e) => setCalcOrigem(formatCoordMask(e.target.value, calcOrigem))}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Destino (XX:YY)
                </label>
                <input
                  type="text"
                  value={calcDestino}
                  onChange={(e) => setCalcDestino(formatCoordMask(e.target.value, calcDestino))}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Tipo de Unidade / Velocidade
              </label>
              <select
                value={velPreset}
                onChange={(e) => {
                  setVelPreset(e.target.value);
                  if (e.target.value !== 'custom') setVelValor(parseInt(e.target.value, 10) || 60);
                }}
                className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-xs sm:text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              >
                <option value="60">Navio Mercante / Trireme / Infantaria (Vel. 60)</option>
                <option value="40">Morteiro / Balão / Aríete a Vapor (Vel. 40)</option>
                <option value="80">Girocóptero (Vel. 80 - Muito Rápido)</option>
                <option value="custom">Velocidade Personalizada...</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Vel. Base
                </label>
                <input
                  type="number"
                  min={10}
                  value={velValor}
                  onChange={(e) => setVelValor(parseInt(e.target.value, 10) || 60)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Posídon/Triton
                </label>
                <select
                  value={bonusMult}
                  onChange={(e) => setBonusMult(parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-[#dcc8a6] bg-white px-2 py-2 text-xs dark:border-[#2d3440] dark:bg-[#0d1117]"
                >
                  <option value={1}>Sem Bônus</option>
                  <option value={2}>Posídon (+100%)</option>
                  <option value={3}>Triton II (+200%)</option>
                  <option value={4}>Triton III (+300%)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Cartas (0-32)
                </label>
                <input
                  type="number"
                  min={0}
                  max={32}
                  value={cartasViagem}
                  onChange={(e) => setCartasViagem(parseInt(e.target.value, 10) || 0)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViagemCalculated(true)}
              className="min-h-[42px] w-full rounded-xl bg-[#8a2a1f] px-4 py-2 text-xs font-bold text-white hover:bg-[#a33428] sm:text-sm"
            >
              Calcular Tempo de Percurso & Impacto
            </button>

            {viagemCalculated && (
              <div className="space-y-1 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs dark:border-[#2d3440] dark:bg-[#1c222b]">
                <div>• Distância: <strong className="font-mono-num">{viagemRes.distanciaIlhas.toFixed(2)} ilhas</strong></div>
                <div>
                  • Tempo (-{viagemRes.descontoCartasPerc}% Cartas):{' '}
                  <strong className="font-mono-num text-sm text-[#8a2a1f] dark:text-[#f87171]">
                    {formatHMS(viagemRes.tempoSegundos)}
                  </strong>
                </div>
                <div>
                  • Impacto: <strong className="font-mono-num">{new Date(viagemRes.impactoMs).toLocaleTimeString('pt-BR')}</strong> ·
                  Retorno: <strong className="font-mono-num">{new Date(viagemRes.retornoMs).toLocaleTimeString('pt-BR')}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addTimer(`Ataque / Viagem para [${calcDestino}]`, viagemRes.tempoSegundos);
                    setActiveTab('militar');
                  }}
                  className="mt-2 rounded-lg bg-[#1b4b6b] px-3 py-1.5 text-xs font-bold text-white"
                >
                  ⏱️ Criar Cronômetro Deste Percurso
                </button>
              </div>
            )}
          </div>
        </CollapsiblePanel>

        {/* 2. Loot & Port */}
        <CollapsiblePanel
          title="Navios de Comércio & Tempo de Porto"
          icon={<PackageCheck className="h-4 w-4" />}
          badge={
            <span className="font-mono-num rounded-md bg-[#1b4b6b]/10 px-2 py-0.5 text-[11px] font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
              {FLEET_MERCHANT_SHIPS}M + {FLEET_FREIGHTERS}C
            </span>
          }
          defaultOpenMobile={false}
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Recursos Totais a Pilhar / Transportar
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={saqueTotalStr}
                onChange={(e) => setSaqueTotalStr(formatNumberDots(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Cap. Mercante
                </label>
                <input
                  type="number"
                  min={50}
                  value={capMercante}
                  onChange={(e) => setCapMercante(parseInt(e.target.value, 10) || 600)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Nível Porto
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={portoNivel}
                  onChange={(e) => setPortoNivel(parseInt(e.target.value, 10) || 1)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Cartas (0-32)
                </label>
                <input
                  type="number"
                  min={0}
                  max={32}
                  value={cartasPorto}
                  onChange={(e) => setCartasPorto(parseInt(e.target.value, 10) || 0)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSaqueCalculated(true)}
              className="min-h-[42px] w-full rounded-xl bg-[#1b4b6b] px-4 py-2 text-xs font-bold text-white hover:bg-[#235d84] sm:text-sm"
            >
              Calcular Barcos & Tempo de Carga
            </button>

            {saqueCalculated && (
              <div className="space-y-1 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs dark:border-[#2d3440] dark:bg-[#1c222b]">
                <div>
                  • Mercantes (cap. {capMercante}):{' '}
                  <strong className="font-mono-num text-[#1b4b6b] dark:text-[#60a5fa]">
                    {portoRes.barcos} navios
                  </strong>{' '}
                  (Disp.: {FLEET_MERCHANT_SHIPS})
                </div>
                <div>
                  • Cargueiros a Vapor (cap. 52k):{' '}
                  <strong className="font-mono-num text-[#c99326] dark:text-[#f2cc60]">
                    {portoRes.cargueiros} cargueiro(s)
                  </strong>{' '}
                  (Disp.: {FLEET_FREIGHTERS})
                </div>
                <div>
                  • Porto Nível {portoNivel}: ~{portoRes.taxaCargaMin.toLocaleString('pt-BR')} un./min ·{' '}
                  <strong>{portoRes.tempoCargaMin} minutos</strong> de carga
                </div>
              </div>
            )}
          </div>
        </CollapsiblePanel>

        {/* 3. Inter-City Supply Routes */}
        <CollapsiblePanel
          title="Rotas de Abastecimento Entre Cidades"
          icon={<Ship className="h-4 w-4" />}
          defaultOpenMobile={true}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Origem (Enviar)
                </label>
                <select
                  value={rotaOrigemId}
                  onChange={(e) => setRotaOrigemId(e.target.value)}
                  className="w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-xs sm:text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
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
                  Destino (Receber)
                </label>
                <select
                  value={rotaDestinoId}
                  onChange={(e) => setRotaDestinoId(e.target.value)}
                  className="w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-xs sm:text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.coords}] {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Recurso
                </label>
                <select
                  value={rotaRecurso}
                  onChange={(e) => setRotaRecurso(e.target.value)}
                  className="w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                >
                  <option value="Madeira">🪵 Madeira</option>
                  <option value="Vinho">🍇 Vinho</option>
                  <option value="Mármore">🏛️ Mármore</option>
                  <option value="Cristal">💎 Cristal</option>
                  <option value="Enxofre">🔥 Enxofre</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Quantidade
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rotaQtdStr}
                  onChange={(e) => setRotaQtdStr(formatNumberDots(e.target.value))}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRotaCalculated(true)}
              className="min-h-[42px] w-full rounded-xl bg-[#8a2a1f] px-4 py-2 text-xs font-bold text-white hover:bg-[#a33428] sm:text-sm"
            >
              Calcular Logística & Barcos
            </button>

            {rotaCalculated && (
              <div className="space-y-1 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs dark:border-[#2d3440] dark:bg-[#1c222b]">
                {rotaSameCity ? (
                  <span className="font-bold text-amber-600">
                    ⚠️ Origem e destino são a mesma cidade — escolha colônias diferentes!
                  </span>
                ) : (
                  <>
                    <div>
                      • Rota: <strong>{cityOrig.nome} [{cityOrig.coords}] ➔ {cityDest.nome} [{cityDest.coords}]</strong> ({rotaRes.dist.toFixed(2)} ilhas)
                    </div>
                    <div>
                      • Frota:{' '}
                      <strong className="font-mono-num text-[#1b4b6b] dark:text-[#60a5fa]">
                        {rotaRes.barcos} Mercantes (600)
                      </strong>{' '}
                      ou <strong className="font-mono-num">{rotaRes.cargueiros} Cargueiro(s) (52k)</strong>
                    </div>
                    <div>
                      • Navegação (-{rotaRes.descontoCartasPerc}% Cartas):{' '}
                      <strong className="font-mono-num">{formatHMS(rotaRes.tempoSeg)}</strong> · Chegada:{' '}
                      <strong className="font-mono-num">{new Date(rotaRes.chegadaMs).toLocaleTimeString('pt-BR')}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addTimer(`Rota ${rotaRecurso}: ${cityOrig.nome} ➔ ${cityDest.nome}`, rotaRes.tempoSeg);
                        setActiveTab('militar');
                      }}
                      className="mt-2 rounded-lg bg-[#1b4b6b] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      ⏱️ Iniciar Cronômetro Desta Rota
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </CollapsiblePanel>

        {/* 4. Building Cost Reducer */}
        <CollapsiblePanel
          title="Otimizador de Custos de Edifícios"
          icon={<Building className="h-4 w-4" />}
          defaultOpenMobile={false}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Edifício Redutor
                </label>
                <select
                  value={redutorEdificio}
                  onChange={(e) => setRedutorEdificio(e.target.value)}
                  className="w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-xs sm:text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                >
                  {COST_REDUCER_BUILDINGS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Nível (0 a 32)
                </label>
                <input
                  type="number"
                  min={0}
                  max={32}
                  value={redutorNivel}
                  onChange={(e) => setRedutorNivel(parseInt(e.target.value, 10) || 0)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Custo Base do Edifício Alvo
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={redutorCustoBaseStr}
                onChange={(e) => setRedutorCustoBaseStr(formatNumberDots(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>

            <div className="rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
              <div>
                <strong>🏛️ Economia com {redutorEdificio} (Nível {redutorNivel}):</strong>
              </div>
              <div>
                • Desconto Ativo: <strong className="text-emerald-600 dark:text-emerald-400">{percDesconto}%</strong> ·
                Economia: <strong className="font-mono-num text-emerald-600 dark:text-emerald-400">{economia.toLocaleString('pt-BR')} un.</strong>
              </div>
              <div>
                • Custo Líquido Final:{' '}
                <strong className="font-mono-num text-sm">{custoFinal.toLocaleString('pt-BR')} un.</strong>
              </div>
            </div>
          </div>
        </CollapsiblePanel>
      </div>

      {/* 5. The 8 Miracles */}
      <CollapsiblePanel
        title="Santuário dos 8 Milagres das Ilhas Ikariam"
        icon={<Sparkles className="h-4 w-4" />}
        badge={<span className="text-[11px] font-bold text-[#c99326]">Bênçãos & Cooldown</span>}
        defaultOpenMobile={false}
      >
        <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
          Toque em um milagre para ativar seu cronômetro oficial de recarga com alerta sonoro e de sistema:
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {MIRACLES.map((m) => (
            <button
              key={m.nome}
              type="button"
              onClick={() => {
                playWarHorn(audioMuted);
                addTimer(`Bênção dos Deuses: ${m.nome}`, m.cooldownHoras * 3600);
                showHudAlert('MILAGRE INVOCADO', `${m.nome}: Cooldown de ${m.cooldownHoras}h iniciado.`, m.icone);
                speakAlertPTBR(`Milagre de ${m.nome} ativado.`, voiceEnabled, audioMuted);
                setActiveTab('militar');
              }}
              className="rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/50 p-3 text-left transition hover:border-[#c99326] hover:bg-[#c99326]/10 dark:border-[#2d3440] dark:bg-[#1c222b]"
            >
              <strong className={`text-sm ${m.cor}`}>
                {m.icone} {m.tituloCompleto}
              </strong>
              <p className="mt-1 text-xs text-[#5c4835] dark:text-[#c9d1d9]">{m.resumo}</p>
              <span className="mt-2 inline-block text-[11px] font-bold text-[#c99326] dark:text-[#f2cc60]">
                Recarga: {m.cooldownHoras} horas
              </span>
            </button>
          ))}
        </div>
      </CollapsiblePanel>
    </div>
  );
};
