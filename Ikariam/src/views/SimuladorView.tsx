import React, { useMemo, useState } from 'react';
import { Coins, Flame, Shield, Waves, BrickWall } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import { OFFICIAL_UNIT_COSTS } from '../data/gameData';
import { playWarDrums } from '../services/audioService';
import { buildBattleSimulation, calcWallSiege, FieldSize } from '../utils/calculations';
import { formatNumberDots, parseCleanNumber } from '../utils/formatters';

export const SimuladorView: React.FC = () => {
  const {
    activeCity,
    armiesMap,
    addTimer,
    setActiveTab,
    showHudAlert,
    audioMuted,
    globalGold,
    setGlobalGold,
  } = useImperial();

  // Battle Line Simulator
  const [modo, setModo] = useState<'terrestre' | 'naval'>('terrestre');
  const [campo, setCampo] = useState<FieldSize>('maior');
  const [distributed, setDistributed] = useState(false);

  // Moral
  const [moralTropas, setMoralTropas] = useState(1500);
  const [moralCozinheiros, setMoralCozinheiros] = useState(30);
  const [moralRodadas, setMoralRodadas] = useState(8);

  // Gold Balance
  const [cidadaosLivres, setCidadaosLivres] = useState(3200);
  const [cientistasQtd, setCientistasQtd] = useState(120);

  // Wall Siege
  const [muralhaNivel, setMuralhaNivel] = useState(18);
  const [muralhaCidadeLvl, setMuralhaCidadeLvl] = useState(20);

  // Waves
  const [ondaHora, setOndaHora] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [ondaTotalQtd, setOndaTotalQtd] = useState(4);
  const [wavesGenerated, setWavesGenerated] = useState(false);

  const activeArmy = armiesMap[activeCity.id] || [];
  const sim = useMemo(
    () => buildBattleSimulation(modo, campo, activeArmy, distributed),
    [modo, campo, activeArmy, distributed]
  );

  // Moral calcs
  const recCoz = Math.max(10, Math.ceil(moralTropas / 45));
  const deficitCoz = recCoz - moralCozinheiros;
  const quedaPorRodada = Math.round((deficitCoz / recCoz) * 12);
  const rodadasFuga = Math.max(2, Math.floor(100 / Math.max(5, quedaPorRodada)));

  // Gold balance calcs
  const rendaCidadaos = cidadaosLivres * 3;
  const custoCientistas = cientistasQtd * 6;
  const custoMilitar = activeArmy.reduce(
    (acc, u) => acc + u.qtd * (OFFICIAL_UNIT_COSTS[u.nome] || u.custo || 3),
    0
  );
  const saldoLiquido = rendaCidadaos - custoCientistas - custoMilitar;

  // Wall siege
  const wall = calcWallSiege(muralhaNivel, muralhaCidadeLvl);

  const handleAutoDistribute = () => {
    if (activeArmy.length === 0) {
      showHudAlert('GUARNIÇÃO VAZIA', `Nenhuma tropa registrada em ${activeCity.nome} para distribuir.`, '⚠️');
      return;
    }
    setDistributed(true);
    showHudAlert(
      modo === 'terrestre' ? 'TROPAS DISTRIBUÍDAS' : 'FROTAS DISTRIBUÍDAS',
      `Posições de ${activeCity.nome} preenchidas automaticamente!`,
      modo === 'terrestre' ? '🛡️' : '⚓'
    );
  };

  const waveRoles = [
    'Onda 1: Linha de Frente + Morteiros (Derrubar Muralha e Fixar Linhas)',
    'Onda 2: Reforço de Hoplitas / Gigantes (Evitar Quebra de Frente na 2ª Rodada)',
    'Onda 3: Nova Rotação de Carabineiros (Munição Renovada) + Flancos',
    'Onda 4: Frotas Mercantes de Saque e Transporte do Butim',
    'Onda 5: Reforço Adicional de Infantaria Pesada',
    'Onda 6: Cozinheiros Suplementares e Médicos de Reserva',
  ];

  const baseWaveDate = useMemo(() => {
    const d = new Date();
    if (ondaHora) {
      const [hh, mm] = ondaHora.split(':');
      d.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0);
    }
    return d;
  }, [ondaHora]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Battle Slots */}
        <CollapsiblePanel
          title="Linhas de Combate Ikariam"
          icon={<Shield className="h-4 w-4" />}
          badge={
            <span className="rounded-md bg-[#1b4b6b]/10 px-2 py-0.5 text-[11px] font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
              {modo === 'terrestre' ? 'Terrestre' : 'Naval'}
            </span>
          }
          defaultOpenMobile={true}
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setModo('terrestre');
                setDistributed(false);
              }}
              className={`min-h-[38px] flex-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                modo === 'terrestre'
                  ? 'border-[#1b4b6b] bg-[#1b4b6b] text-white dark:border-[#c99326] dark:bg-[#c99326] dark:text-[#0d1117]'
                  : 'border-[#dcc8a6] bg-[#f7f0e0]/60 text-[#5c4835] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#c9d1d9]'
              }`}
            >
              🛡️ Batalha Terrestre
            </button>
            <button
              type="button"
              onClick={() => {
                setModo('naval');
                setDistributed(false);
              }}
              className={`min-h-[38px] flex-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                modo === 'naval'
                  ? 'border-[#1b4b6b] bg-[#1b4b6b] text-white dark:border-[#c99326] dark:bg-[#c99326] dark:text-[#0d1117]'
                  : 'border-[#dcc8a6] bg-[#f7f0e0]/60 text-[#5c4835] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#c9d1d9]'
              }`}
            >
              ⚓ Batalha Naval
            </button>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Tamanho do Campo
              </label>
              <select
                value={campo}
                onChange={(e) => setCampo(e.target.value as FieldSize)}
                className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-xs sm:text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              >
                <option value="pequeno">Campo Pequeno (Lvl 1 - 4) · 3 Slots</option>
                <option value="medio">Campo Médio (Lvl 5 - 9) · 5 Slots</option>
                <option value="grande">Campo Grande (Lvl 10 - 16) · 7 Slots</option>
                <option value="maior">Campo Maior (Lvl 17 - 24) · 7 Slots + Flancos</option>
                <option value="ilimitado">Campo Ilimitado (Lvl 25+) · Força Total</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAutoDistribute}
                className="min-h-[38px] w-full rounded-lg bg-[#8a2a1f] px-3 py-2 text-xs font-bold text-white hover:bg-[#a33428]"
              >
                ⚡ Distribuir ({activeCity.nome})
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: modo === 'terrestre' ? '🛡️ 1ª Linha (Frente)' : '⚓ 1ª Linha Naval',
                hint: modo === 'terrestre' ? 'Hoplitas / Gigantes' : 'Lança-Chamas / Aríetes',
                slots: sim.frente,
              },
              {
                title: modo === 'terrestre' ? '🎯 2ª Linha (Tiro)' : '🚀 2ª Linha Naval',
                hint: modo === 'terrestre' ? 'Carabineiros' : 'Catapultas / Foguetes',
                slots: sim.longo,
              },
              {
                title: modo === 'terrestre' ? '⚔️ Flancos Laterais' : '⛵ Flancos Navais',
                hint: modo === 'terrestre' ? 'Espadachins' : 'Triremes / Lanchas',
                slots: sim.flancos,
              },
              {
                title: modo === 'terrestre' ? '💣 Artilharia & Cerco' : '💥 Artilharia Naval',
                hint: modo === 'terrestre' ? 'Morteiros / Aríetes' : 'Barcos Morteiro',
                slots: sim.artilharia,
              },
              {
                title: modo === 'terrestre' ? '🚁 Linha Aérea' : '🤿 Esquadra Especial',
                hint: modo === 'terrestre' ? 'Girocópteros / Balões' : 'Submergíveis / Porta-Balões',
                slots: sim.aereo,
              },
            ].map((line) => (
              <div
                key={line.title}
                className="rounded-xl border border-[#dcc8a6]/70 bg-[#f7f0e0]/40 p-2.5 dark:border-[#2d3440] dark:bg-[#1c222b]"
              >
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <strong className="text-[#24190e] dark:text-[#f2cc60]">{line.title}</strong>
                  <span className="text-[11px] text-[#7d6b56] dark:text-[#8b949e]">{line.hint}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {line.slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`rounded-md border px-2 py-1 text-[11px] ${
                        slot.occupied
                          ? 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-800 dark:text-emerald-300'
                          : 'border-[#dcc8a6] bg-white text-[#5c4835] dark:border-[#30363d] dark:bg-[#0d1117] dark:text-[#8b949e]'
                      }`}
                    >
                      <div>{slot.label}</div>
                      <div className="font-mono-num text-[10px] opacity-90">{slot.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
            {sim.resumoLinhas.map((line, i) => (
              <div key={i}>• {line}</div>
            ))}
          </div>
        </CollapsiblePanel>

        {/* Right Column: Morale & Gold */}
        <div className="space-y-4">
          <CollapsiblePanel
            title="Calculadora de Cozinheiros & Moral"
            icon={<Flame className="h-4 w-4" />}
            defaultOpenMobile={true}
          >
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Combatentes na Batalha
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={moralTropas}
                  onChange={(e) => setMoralTropas(parseInt(e.target.value, 10) || 100)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                    Cozinheiros / Suporte
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={moralCozinheiros}
                    onChange={(e) => setMoralCozinheiros(parseInt(e.target.value, 10) || 0)}
                    className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                    Duração (Rodadas)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={moralRodadas}
                    onChange={(e) => setMoralRodadas(parseInt(e.target.value, 10) || 1)}
                    className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  addTimer('Batalha: Troca de Rodada (15m)', 15 * 60);
                  showHudAlert('CRONÔMETRO INICIADO', 'Alarme de troca de rodada (15m) ativado!', '⚔️');
                  setActiveTab('militar');
                }}
                className="min-h-[42px] w-full rounded-xl bg-[#1b4b6b] px-4 py-2 text-xs font-bold text-white hover:bg-[#235d84]"
              >
                ⏱️ Iniciar Cronômetro de Rodada (15m)
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
              {moralCozinheiros >= recCoz ? (
                <div>
                  <strong className="text-emerald-600 dark:text-emerald-400">🟢 MORAL EM 100% GARANTIDA!</strong>
                  <p className="mt-1">
                    Seus {moralCozinheiros} cozinheiros sustentam todas as {moralRodadas} rodadas sem risco de debandada.
                  </p>
                </div>
              ) : moralCozinheiros > 0 ? (
                <div>
                  <strong className="text-amber-600 dark:text-amber-400">⚠️ MORAL INSTÁVEL!</strong>
                  <p className="mt-1">
                    Faltam <strong>{deficitCoz} cozinheiros</strong> (Recomendado: {recCoz}). Queda de ~{quedaPorRodada}%/rodada; risco de fuga por volta da <strong>{rodadasFuga}ª rodada</strong>.
                  </p>
                </div>
              ) : (
                <div>
                  <strong className="text-red-600 dark:text-red-400">🚨 SEM COZINHEIROS (PERIGO CRÍTICO)!</strong>
                  <p className="mt-1">O exército corre risco de fugir na 3ª ou 4ª rodada, mesmo vencendo!</p>
                </div>
              )}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Balanço Econômico & Tesouro de Ouro"
            icon={<Coins className="h-4 w-4" />}
            defaultOpenMobile={false}
          >
            <div className="mb-3">
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Reserva Global de Ouro (Mostrada no Topo)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberDots(Math.floor(globalGold))}
                onChange={(e) => setGlobalGold(parseCleanNumber(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm font-bold text-[#c99326] dark:border-[#2d3440] dark:bg-[#0d1117] dark:text-[#f2cc60]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Cidadãos Livres (+3 o/h)
                </label>
                <input
                  type="number"
                  min={0}
                  value={cidadaosLivres}
                  onChange={(e) => setCidadaosLivres(parseInt(e.target.value, 10) || 0)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Cientistas (-6 o/h)
                </label>
                <input
                  type="number"
                  min={0}
                  value={cientistasQtd}
                  onChange={(e) => setCientistasQtd(parseInt(e.target.value, 10) || 0)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            </div>

            <div className="mt-3 space-y-1 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs dark:border-[#2d3440] dark:bg-[#1c222b]">
              <div className="font-bold text-[#24190e] dark:text-[#f2cc60]">
                🪙 Balanço em {activeCity.nome}:
              </div>
              <div>
                • Renda Cidadãos:{' '}
                <strong className="font-mono-num text-emerald-600 dark:text-emerald-400">
                  +{rendaCidadaos.toLocaleString('pt-BR')} Ouro/h
                </strong>
              </div>
              <div>
                • Cientistas:{' '}
                <span className="font-mono-num">-{custoCientistas.toLocaleString('pt-BR')} Ouro/h</span> · Tropas:{' '}
                <span className="font-mono-num text-[#8a2a1f] dark:text-[#f87171]">
                  -{custoMilitar.toLocaleString('pt-BR')} Ouro/h
                </span>
              </div>
              <div className="pt-1 text-sm">
                Saldo Líquido:{' '}
                <strong
                  className={`font-mono-num ${
                    saldoLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {saldoLiquido >= 0 ? '+' : ''}
                  {saldoLiquido.toLocaleString('pt-BR')} Ouro/h
                </strong>{' '}
                ({(saldoLiquido * 24).toLocaleString('pt-BR')}/dia)
              </div>
            </div>
          </CollapsiblePanel>
        </div>
      </div>

      {/* Bottom Row: Wall Siege & Wave Planner */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CollapsiblePanel
          title="Calculadora de Muralha & Dano de Cerco"
          icon={<BrickWall className="h-4 w-4" />}
          defaultOpenMobile={false}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Muralha Inimiga (0 a 40)
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={muralhaNivel}
                onChange={(e) => setMuralhaNivel(parseInt(e.target.value, 10) || 0)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Nível da Cidade Inimiga
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={muralhaCidadeLvl}
                onChange={(e) => setMuralhaCidadeLvl(parseInt(e.target.value, 10) || 1)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3.5 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
            {wall.semMuralha ? (
              <strong className="text-emerald-600 dark:text-emerald-400">
                🟢 CIDADE SEM MURALHA! Combatentes entram sem resistência de cerco.
              </strong>
            ) : (
              <div className="space-y-1">
                <div>
                  <strong>🧱 Análise Balística (Muralha Nível {muralhaNivel}):</strong>
                </div>
                <div>
                  • {wall.segmentos} seções × {wall.hpSegmento.toLocaleString('pt-BR')} HP (Armadura: {wall.armaduraMuralha}) ={' '}
                  <strong className="font-mono-num text-[#8a2a1f] dark:text-[#f87171]">
                    {wall.hpTotalMuralha.toLocaleString('pt-BR')} HP Total
                  </strong>
                </div>
                <div>
                  • Para abrir brecha na 1ª Rodada:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {wall.slotsMorteiro1Rodada} slot(s) de Morteiro (~{wall.morteirosRecomendados} un.)
                  </strong>
                </div>
                <div>• Tempo com Aríetes: ~{wall.rodadasAriete} rodadas de impacto</div>
              </div>
            )}
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Planejador de Ondas & Rotação (Ciclo 15m)"
          icon={<Waves className="h-4 w-4" />}
          defaultOpenMobile={false}
        >
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Hora Inicial
              </label>
              <input
                type="time"
                value={ondaHora}
                onChange={(e) => setOndaHora(e.target.value)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-xs dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Ondas
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={ondaTotalQtd}
                onChange={(e) => setOndaTotalQtd(Math.max(2, Math.min(10, parseInt(e.target.value, 10) || 4)))}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-xs dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setWavesGenerated(true);
                  playWarDrums(audioMuted);
                }}
                className="min-h-[38px] w-full rounded-lg bg-[#1b4b6b] px-3 py-2 text-xs font-bold text-white hover:bg-[#235d84]"
              >
                Gerar Escala
              </button>
            </div>
          </div>

          {wavesGenerated && (
            <div className="mt-3 space-y-1.5 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3 dark:border-[#2d3440] dark:bg-[#1c222b]">
              {Array.from({ length: ondaTotalQtd }, (_, i) => {
                const dOnda = new Date(baseWaveDate.getTime() + i * 15 * 60 * 1000);
                const role = waveRoles[i] || `Onda ${i + 1}: Reforço Tático Suplementar`;
                const segs = Math.max(60, Math.round((dOnda.getTime() - Date.now()) / 1000));
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 border-b border-dashed border-[#dcc8a6] py-1.5 last:border-none dark:border-[#2d3440]"
                  >
                    <div className="min-w-0 text-xs">
                      <strong className="text-[#8a2a1f] dark:text-[#f2cc60]">
                        Onda {i + 1} · {dOnda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                      <div className="truncate text-[11px] text-[#5c4835] dark:text-[#c9d1d9]">{role}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addTimer(`Onda ${i + 1} (${dOnda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`, segs);
                        setActiveTab('militar');
                      }}
                      className="shrink-0 rounded-md bg-[#1b4b6b] px-2.5 py-1 text-[11px] font-bold text-white"
                    >
                      ⏱️ Alarme
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsiblePanel>
      </div>
    </div>
  );
};
