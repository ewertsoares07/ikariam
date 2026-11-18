import React, { useState } from 'react';
import { Eye, Search, Swords, Trash2 } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import { formatCoordMask, formatNumberDots, parseCleanNumber } from '../utils/formatters';

export const EspionagemView: React.FC = () => {
  const { spyTargets, upsertSpyTarget, removeSpyTarget, triggerPrefillRoute } = useImperial();

  const [nome, setNome] = useState('');
  const [coords, setCoords] = useState('');
  const [armazemStr, setArmazemStr] = useState('32.000');
  const [notas, setNotas] = useState('');
  const [filtro, setFiltro] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !coords.trim()) return;
    upsertSpyTarget({
      nome: nome.trim(),
      coords: coords.trim(),
      armazem: parseCleanNumber(armazemStr),
      notas: notas.trim(),
    });
    setNome('');
    setCoords('');
    setArmazemStr('32.000');
    setNotas('');
  };

  const filtered = spyTargets.filter((a) => {
    const q = filtro.toLowerCase();
    return (
      a.nome.toLowerCase().includes(q) ||
      a.coords.toLowerCase().includes(q) ||
      (a.notas && a.notas.toLowerCase().includes(q))
    );
  });

  return (
    <CollapsiblePanel
      title="Quartel-General de Espionagem & Alvos de Saque"
      icon={<Eye className="h-4 w-4" />}
      badge={
        <span className="rounded-md bg-[#1b4b6b]/10 px-2 py-0.5 text-[11px] font-bold text-[#1b4b6b] dark:text-[#60a5fa]">
          Saque Máx 20%
        </span>
      }
      defaultOpenMobile={true}
    >
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Nome do Alvo / Cidade
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Colônia Alpha / Farma"
              className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Coordenadas (XX:YY)
            </label>
            <input
              type="text"
              required
              value={coords}
              onChange={(e) => setCoords(formatCoordMask(e.target.value, coords))}
              placeholder="Ex: 93:24"
              className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Armazém do Alvo
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={armazemStr}
              onChange={(e) => setArmazemStr(formatNumberDots(e.target.value))}
              className="font-mono-num w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
              Notas de Defesa / Recursos
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ex: Muito mármore, muralha 6"
              className="w-full rounded-lg border border-[#dcc8a6] bg-white px-3 py-2 text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-2 min-h-[42px] rounded-xl bg-[#8a2a1f] px-4 py-2 text-xs font-bold text-white hover:bg-[#a33428] sm:text-sm"
          >
            Cadastrar / Atualizar Alvo
          </button>
          <button
            type="button"
            onClick={() => {
              setNome('');
              setCoords('');
              setArmazemStr('32.000');
              setNotas('');
            }}
            className="flex-1 min-h-[42px] rounded-xl bg-[#1b4b6b] px-4 py-2 text-xs font-bold text-white hover:bg-[#235d84] sm:text-sm"
          >
            Limpar
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7d6b56]" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar por nome, notas ou coordenadas..."
            className="w-full rounded-lg border border-[#dcc8a6] bg-white py-2 pr-3 pl-9 text-xs sm:text-sm dark:border-[#2d3440] dark:bg-[#0d1117]"
          />
        </div>
        <span className="text-xs font-bold text-[#5c4835] dark:text-[#c9d1d9]">
          {filtered.length} Alvo(s) Registrado(s)
        </span>
      </div>

      <div className="mt-3 max-h-96 overflow-x-auto rounded-xl border border-[#dcc8a6] dark:border-[#2d3440]">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#f7f0e0] text-[#5c4835] dark:bg-[#1c222b] dark:text-[#f2cc60]">
            <tr>
              <th className="px-3 py-2.5">Coords</th>
              <th className="px-3 py-2.5">Cidade / Alvo</th>
              <th className="px-3 py-2.5">Armazém</th>
              <th className="px-3 py-2.5">Saque Máx (20%)</th>
              <th className="px-3 py-2.5">Barcos (600)</th>
              <th className="px-3 py-2.5">Notas</th>
              <th className="px-3 py-2.5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dcc8a6]/50 dark:divide-[#2d3440]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[#7d6b56] dark:text-[#8b949e]">
                  Nenhum alvo encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((a) => {
                const saqueMax = Math.round(a.armazem * 0.2);
                const barcos = Math.ceil(saqueMax / 600);
                return (
                  <tr key={a.id} className="bg-white dark:bg-[#161b22]">
                    <td className="font-mono-num px-3 py-2.5 font-bold">[{a.coords}]</td>
                    <td className="px-3 py-2.5 font-bold text-[#24190e] dark:text-white">{a.nome}</td>
                    <td className="font-mono-num px-3 py-2.5">{a.armazem.toLocaleString('pt-BR')}</td>
                    <td className="font-mono-num px-3 py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {saqueMax.toLocaleString('pt-BR')}
                    </td>
                    <td className="font-mono-num px-3 py-2.5">{barcos} barcos</td>
                    <td className="px-3 py-2.5 text-[#5c4835] dark:text-[#c9d1d9]">{a.notas || '-'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            triggerPrefillRoute({
                              destinoCoords: a.coords,
                              saqueTotal: saqueMax,
                            })
                          }
                          className="inline-flex h-7 items-center gap-1 rounded-md bg-[#1b4b6b] px-2 text-[11px] font-bold text-white hover:bg-[#235d84]"
                          title="Enviar para Calculadora de Viagem"
                        >
                          <Swords className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSpyTarget(a.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600/90 text-white hover:bg-red-700"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </CollapsiblePanel>
  );
};
