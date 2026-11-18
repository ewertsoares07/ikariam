import React, { useState } from 'react';
import { Building2, Plus, Target, Trash2 } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import {
  BUILDING_LIST,
  FLEET_FREIGHTER_CAP,
  FLEET_MERCHANT_CAP,
  getDefaultCityResources,
} from '../data/gameData';
import { formatCountdown, formatNumberDots, parseCleanNumber } from '../utils/formatters';

export const EdificiosView: React.FC = () => {
  const {
    now,
    cities,
    activeCityId,
    obrasFila,
    addObra,
    removeObra,
    metasEdificios,
    addMeta,
    removeMeta,
    resourcesMap,
  } = useImperial();

  const [obraCityId, setObraCityId] = useState(activeCityId);
  const [edificioNome, setEdificioNome] = useState('Câmara Municipal');
  const [nivelAlvo, setNivelAlvo] = useState(25);
  const [horas, setHoras] = useState(4);
  const [minutos, setMinutos] = useState(30);
  const [segundos, setSegundos] = useState(0);

  const [metaCityId, setMetaCityId] = useState(activeCityId);
  const [metaNome, setMetaNome] = useState('Palácio (Nova Colônia)');
  const [metaMadeira, setMetaMadeira] = useState('280.000');
  const [metaMarmore, setMetaMarmore] = useState('195.000');
  const [metaVinho, setMetaVinho] = useState('0');
  const [metaCristal, setMetaCristal] = useState('0');
  const [metaEnxofre, setMetaEnxofre] = useState('0');

  const sortedObras = [...obrasFila].sort((a, b) => a.termino - b.termino);

  const handleAddObra = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeg = (horas || 0) * 3600 + (minutos || 0) * 60 + (segundos || 0);
    if (totalSeg <= 0) return;
    addObra(obraCityId, edificioNome, Math.max(1, nivelAlvo || 1), totalSeg);
  };

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    addMeta({
      cidadeId: metaCityId,
      nome: metaNome.trim() || 'Edifício Alvo',
      madeira: parseCleanNumber(metaMadeira),
      marmore: parseCleanNumber(metaMarmore),
      vinho: parseCleanNumber(metaVinho),
      cristal: parseCleanNumber(metaCristal),
      enxofre: parseCleanNumber(metaEnxofre),
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 1. Fila de Construção */}
      <CollapsiblePanel
        title="Obras & Próximos Edifícios a Concluir"
        icon={<Building2 className="h-4 w-4" />}
        badge={
          <span className="rounded-md bg-[#1b4b6b]/10 px-2 py-0.5 text-[11px] font-bold text-[#1b4b6b] dark:bg-white/10 dark:text-[#f2cc60]">
            {sortedObras.length} na Fila
          </span>
        }
        defaultOpenMobile={true}
      >
        <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
          Cadastre os edifícios em evolução. A contagem regressiva roda em tempo real e ordena automaticamente pelos que <strong>terminam primeiro</strong>.
        </p>

        <form onSubmit={handleAddObra} className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Colônia / Cidade
              </label>
              <select
                value={obraCityId}
                onChange={(e) => setObraCityId(e.target.value)}
                className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm text-[#24190e] dark:border-[#2d3440] dark:bg-[#0d1117] dark:text-[#f0f6fc]"
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
                Edifício
              </label>
              <select
                value={edificioNome}
                onChange={(e) => setEdificioNome(e.target.value)}
                className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm text-[#24190e] dark:border-[#2d3440] dark:bg-[#0d1117] dark:text-[#f0f6fc]"
              >
                {BUILDING_LIST.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Nível Alvo
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={nivelAlvo}
                onChange={(e) => setNivelAlvo(parseInt(e.target.value, 10) || 1)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Horas
              </label>
              <input
                type="number"
                min={0}
                value={horas}
                onChange={(e) => setHoras(parseInt(e.target.value, 10) || 0)}
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
                value={minutos}
                onChange={(e) => setMinutos(parseInt(e.target.value, 10) || 0)}
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
                value={segundos}
                onChange={(e) => setSegundos(parseInt(e.target.value, 10) || 0)}
                className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#8a2a1f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#a33428]"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar à Fila de Construção</span>
          </button>
        </form>

        <div className="mt-4 border-t border-[#dcc8a6]/60 pt-3 dark:border-[#2d3440]">
          <h3 className="mb-2 text-xs font-extrabold tracking-wide text-[#5c4835] uppercase dark:text-[#c9d1d9]">
            ⏱️ Próximas Conclusões (Ordem Cronológica)
          </h3>

          {sortedObras.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7d6b56] dark:text-[#8b949e]">
              Nenhuma obra em andamento registrada.
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {sortedObras.map((o) => {
                const remSec = Math.max(0, Math.floor((o.termino - now) / 1000));
                const done = remSec === 0;
                return (
                  <div
                    key={o.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                      done
                        ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : 'border-[#dcc8a6] bg-[#f7f0e0]/50 dark:border-[#2d3440] dark:bg-[#1c222b]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <strong className="text-sm text-[#24190e] dark:text-white">
                          {o.edificio} ➔ Nível {o.nivelAlvo}
                        </strong>
                        <span className="text-xs font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
                          [{o.cidadeId}]
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-[#7d6b56] dark:text-[#8b949e]">
                        {done ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ✔ CONSTRUÇÃO FINALIZADA
                          </span>
                        ) : (
                          <span>⏱️ Término: {new Date(o.termino).toLocaleTimeString('pt-BR')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`font-mono-num rounded-lg border px-2.5 py-1 text-sm font-extrabold ${
                          done
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'border-[#8a2a1f]/25 bg-[#8a2a1f]/10 text-[#8a2a1f] dark:border-[#dc5b4a]/30 dark:text-[#f87171]'
                        }`}
                      >
                        {formatCountdown(remSec)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeObra(o.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/90 text-white hover:bg-red-700"
                        title="Excluir Obra"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsiblePanel>

      {/* 2. Metas de Edifícios */}
      <CollapsiblePanel
        title="Metas de Edifícios & Recursos Necessários"
        icon={<Target className="h-4 w-4" />}
        badge={
          <span className="rounded-md bg-[#c99326]/15 px-2 py-0.5 text-[11px] font-bold text-[#8e683f] dark:text-[#f2cc60]">
            {metasEdificios.length} Metas
          </span>
        }
        defaultOpenMobile={true}
      >
        <p className="mb-3 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
          Compare automaticamente o custo da próxima melhoria com o estoque atual da cidade e calcule os <strong>Barcos Mercantes (600)</strong> ou <strong>Cargueiros (52k)</strong> necessários.
        </p>

        <form onSubmit={handleSaveMeta} className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                Colônia Alvo
              </label>
              <select
                value={metaCityId}
                onChange={(e) => setMetaCityId(e.target.value)}
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
                Edifício da Meta
              </label>
              <input
                type="text"
                value={metaNome}
                onChange={(e) => setMetaNome(e.target.value)}
                placeholder="Ex: Palácio Lvl 11 / Armazém Lvl 35"
                className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: '🪵 Madeira', val: metaMadeira, set: setMetaMadeira },
              { label: '🏛️ Mármore', val: metaMarmore, set: setMetaMarmore },
              { label: '🍇 Vinho', val: metaVinho, set: setMetaVinho },
              { label: '💎 Cristal', val: metaCristal, set: setMetaCristal },
              { label: '🔥 Enxofre', val: metaEnxofre, set: setMetaEnxofre },
            ].map((field) => (
              <div key={field.label}>
                <label className="mb-1 block text-[11px] font-bold text-[#5c4835] dark:text-[#c9d1d9]">
                  {field.label}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={field.val}
                  onChange={(e) => field.set(formatNumberDots(e.target.value))}
                  className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-2.5 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1b4b6b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#235d84]"
          >
            🎯 Salvar Meta de Construção
          </button>
        </form>

        <div className="mt-4 space-y-2.5 border-t border-[#dcc8a6]/60 pt-3 dark:border-[#2d3440]">
          {metasEdificios.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7d6b56] dark:text-[#8b949e]">
              Nenhuma meta de edifício cadastrada.
            </div>
          ) : (
            metasEdificios.map((m) => {
              const res = resourcesMap[m.cidadeId] || getDefaultCityResources(m.cidadeId);
              const totalNec = m.madeira + m.marmore + m.vinho + m.cristal + m.enxofre;
              const totalDisp =
                Math.min(m.madeira, res.madeira.atual) +
                Math.min(m.marmore, res.marmore.atual) +
                Math.min(m.vinho, res.vinho.atual) +
                Math.min(m.cristal, res.cristal.atual) +
                Math.min(m.enxofre, res.enxofre.atual);
              const falta = Math.max(0, totalNec - totalDisp);
              const perc = totalNec > 0 ? Math.min(100, Math.round((totalDisp / totalNec) * 100)) : 100;
              const barcos = Math.ceil(falta / FLEET_MERCHANT_CAP);
              const cargueiros = Math.ceil(falta / FLEET_FREIGHTER_CAP);

              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/50 p-3.5 dark:border-[#2d3440] dark:bg-[#1c222b]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <strong className="text-sm text-[#24190e] dark:text-white">🎯 {m.nome}</strong>
                      <span className="ml-1.5 text-xs font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
                        [{m.cidadeId}]
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono-num text-xs font-extrabold ${
                          perc >= 100
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[#c99326] dark:text-[#f2cc60]'
                        }`}
                      >
                        {perc}% Pronto
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMeta(m.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600/90 text-white hover:bg-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-2 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-black/40">
                    <div
                      className={`h-full rounded-full transition-all ${
                        perc >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#c99326] to-[#f2cc60]'
                      }`}
                      style={{ width: `${perc}%` }}
                    />
                  </div>

                  <div className="space-y-0.5 text-xs text-[#5c4835] dark:text-[#c9d1d9]">
                    <div>
                      • Faltam no total:{' '}
                      <strong
                        className={`font-mono-num ${
                          falta === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {Math.floor(falta).toLocaleString('pt-BR')} recursos
                      </strong>
                    </div>
                    <div>
                      • Transporte necessário:{' '}
                      <strong className="font-mono-num">{barcos} Barcos Mercantes (600)</strong> ou{' '}
                      <strong className="font-mono-num">{cargueiros} Cargueiro(s) (52.000)</strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CollapsiblePanel>
    </div>
  );
};
