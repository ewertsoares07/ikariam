import React, { useState } from 'react';
import { Anchor, Skull } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import { PIRATE_RAIDS } from '../data/gameData';
import { playWarDrums, speakAlertPTBR } from '../services/audioService';

export const PiratariaView: React.FC = () => {
  const { addTimer, setActiveTab, showHudAlert, audioMuted, voiceEnabled } = useImperial();

  const [pontosAcumulados, setPontosAcumulados] = useState(12500);
  const [fortalezaNivel, setFortalezaNivel] = useState(18);
  const [suaTripulacao, setSuaTripulacao] = useState(1250);
  const [rivalTripulacao, setRivalTripulacao] = useState(900);
  const [rivalFortalezaMult, setRivalFortalezaMult] = useState(1.25);

  const tripulantes = Math.floor(pontosAcumulados / 10);
  const defesaRival = rivalTripulacao * rivalFortalezaMult;
  const razao = suaTripulacao / Math.max(1, defesaRival);
  const probVitoria = Math.min(99, Math.max(1, Math.round((razao / (razao + 1)) * 100)));

  const handleLaunchRaid = (seg: number, nome: string, pts: number) => {
    addTimer(`Pirataria: ${nome}`, seg);
    playWarDrums(audioMuted);
    showHudAlert('RAID PIRATA DISPARADO', `Missão "${nome}" iniciada (+${pts} pts)!`, '🏴‍☠️');
    speakAlertPTBR(`Raid pirata ${nome} iniciado com sucesso.`, voiceEnabled, audioMuted);
    setActiveTab('militar');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 1. Capture Raids */}
      <CollapsiblePanel
        title="Missões de Captura (Fortaleza dos Piratas)"
        icon={<Anchor className="h-4 w-4" />}
        defaultOpenMobile={true}
      >
        <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
          Toque em <strong>Disparar Raid</strong> para iniciar a contagem regressiva com áudio e notificação do sistema.
        </p>

        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {PIRATE_RAIDS.map((raid) => (
            <div
              key={raid.nomeCurto}
              className="flex items-center justify-between gap-2 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/50 px-3 py-2.5 dark:border-[#2d3440] dark:bg-[#1c222b]"
            >
              <div className="min-w-0">
                <strong className="block truncate text-xs text-[#24190e] sm:text-sm dark:text-white">
                  ⚓ {raid.titulo}
                </strong>
                <span className="font-mono-num text-[11px] text-[#7d6b56] dark:text-[#8b949e]">
                  Recompensa: +{raid.pontos.toLocaleString('pt-BR')} Pontos de Captura
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchRaid(raid.segundos, raid.nomeCurto, raid.pontos)}
                className="min-h-[38px] shrink-0 rounded-lg bg-[#8a2a1f] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#a33428]"
              >
                ⚔️ Disparar
              </button>
            </div>
          ))}
        </div>
      </CollapsiblePanel>

      {/* 2. Crew & Rival Fortress Simulator */}
      <CollapsiblePanel
        title="Tripulação & Força de Invasão"
        icon={<Skull className="h-4 w-4" />}
        defaultOpenMobile={true}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Pontos de Captura Acumulados
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={pontosAcumulados}
              onChange={(e) => setPontosAcumulados(parseInt(e.target.value, 10) || 0)}
              className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Nível da Fortaleza
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={fortalezaNivel}
                onChange={(e) => setFortalezaNivel(parseInt(e.target.value, 10) || 1)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Custo / Tripulante
              </label>
              <input
                type="number"
                readOnly
                value={10}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-[#f7f0e0] px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#1c222b]"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
            <div className="font-bold text-[#24190e] dark:text-[#f2cc60]">
              ⚓ Conversão de Pontos em Força:
            </div>
            <div>
              • Pontos Convertíveis: <strong className="font-mono-num">{pontosAcumulados.toLocaleString('pt-BR')}</strong>
            </div>
            <div>
              • Tripulantes Obtidos:{' '}
              <strong className="font-mono-num text-[#8a2a1f] dark:text-[#f87171]">
                {tripulantes.toLocaleString('pt-BR')} piratas
              </strong>{' '}
              (Ataque/Defesa: {tripulantes.toLocaleString('pt-BR')})
            </div>
            <div>• Fortaleza Nível {fortalezaNivel}: Proteção passiva ativa contra espionagem.</div>
          </div>

          <div className="border-t border-[#dcc8a6]/60 pt-3 dark:border-[#2d3440]">
            <h3 className="mb-2 text-xs font-extrabold text-[#24190e] uppercase dark:text-[#f2cc60]">
              ⚔️ Previsor de Ataque a Fortaleza Rival
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Sua Tripulação
                </label>
                <input
                  type="number"
                  min={1}
                  value={suaTripulacao}
                  onChange={(e) => setSuaTripulacao(parseInt(e.target.value, 10) || 1)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  Tripulação Rival
                </label>
                <input
                  type="number"
                  min={1}
                  value={rivalTripulacao}
                  onChange={(e) => setRivalTripulacao(parseInt(e.target.value, 10) || 1)}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Fortaleza do Defensor
              </label>
              <select
                value={rivalFortalezaMult}
                onChange={(e) => setRivalFortalezaMult(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-xs sm:text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              >
                <option value={1.1}>Fortaleza Nível 1 - 5 (+10% Defesa)</option>
                <option value={1.25}>Fortaleza Nível 6 - 15 (+25% Defesa)</option>
                <option value={1.5}>Fortaleza Nível 16 - 25 (+50% Defesa)</option>
                <option value={1.8}>Fortaleza Nível 26 - 32 (+80% Defesa)</option>
              </select>
            </div>

            <div className="mt-3 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/70 p-3 text-xs leading-relaxed dark:border-[#2d3440] dark:bg-[#1c222b]">
              <div>
                • Sua Força: <strong className="font-mono-num">{suaTripulacao.toLocaleString('pt-BR')}</strong> ·
                Defesa Rival: <strong className="font-mono-num">{Math.round(defesaRival).toLocaleString('pt-BR')}</strong>
              </div>
              <div className="mt-1">
                Chance de Sucesso:{' '}
                <strong
                  className={`font-mono-num text-sm ${
                    probVitoria >= 65
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : probVitoria >= 45
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {probVitoria}%
                </strong>
              </div>
            </div>
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  );
};
