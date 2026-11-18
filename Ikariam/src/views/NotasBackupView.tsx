import React from 'react';
import { Bell, Cloud, Copy, Download, FileText, RefreshCw, RotateCcw, Upload } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useImperial } from '../context/ImperialContext';
import { OFFICIAL_UNIT_COSTS } from '../data/gameData';
import { playGoldCoins } from '../services/audioService';

export const NotasBackupView: React.FC = () => {
  const {
    activeCity,
    armiesMap,
    notes,
    setNotes,
    autoSyncEnabled,
    setAutoSyncEnabled,
    cloudStatusText,
    syncNowToCloud,
    pullFromCloud,
    showHudAlert,
    audioMuted,
    resetAllData,
    reloadFromLocalStorage,
    notificationPermission,
    requestNotifications,
  } = useImperial();

  const insertTemplate = (tipo: 'espionagem' | 'ataque' | 'tratado') => {
    let snippet = '';
    if (tipo === 'espionagem') {
      snippet = `\n--- 🕵️ RELATÓRIO DE ESPIONAGEM [${new Date().toLocaleDateString('pt-BR')}] ---\nAlvo: \nCoordenadas: [XX:YY]\nNível Muralha: \nGuarnição Inimiga: \nRecursos Disponíveis: \n`;
    } else if (tipo === 'ataque') {
      snippet = `\n--- ⚔️ PLANO DE ATAQUE COMBINADO ---\nOnda 1 (Abre Fila): [Impacto HH:MM:SS]\nOnda 2 (Infantaria Principal): [Impacto HH:MM:SS]\nOnda 3 (Frotas de Saque): [Impacto HH:MM:SS]\n`;
    } else {
      snippet = `\n--- 📜 ACORDO DE PAZ / PACTO DE NÃO AGRESSÃO (PNA) ---\nAliança Parceira: \nTermos de Ajuda Mútua: \nIlhas Protegidas: \n`;
    }
    setNotes(notes + snippet);
  };

  const copyBBCode = () => {
    const lista = armiesMap[activeCity.id] || [];
    const upkeep = lista.reduce(
      (acc, u) => acc + u.qtd * (OFFICIAL_UNIT_COSTS[u.nome] || u.custo || 3),
      0
    );

    let bb = `[quote][b][size=14][color=#8a2a1f]🏛️ IKARIAM IMPERIAL REPORT · ${activeCity.nome} [${activeCity.coords}][/color][/size][/b]\n`;
    bb += `[b][color=#1b4b6b]━━━ 🛡️ GUARNICAO MILITAR ━━━[/color][/b]\n`;
    lista.forEach((u) => {
      bb += `• [b]${u.nome}[/b]: ${u.qtd.toLocaleString('pt-BR')} unidades (Custo: ${(
        u.qtd * u.custo
      ).toLocaleString('pt-BR')} ouro/h)\n`;
    });
    bb += `\n[b]💰 Manutenção Total Militar:[/b] [color=#c99326]${upkeep.toLocaleString('pt-BR')} Ouro/hora[/color]\n`;
    bb += `[i]Gerado pelo Painel Imperial Ikariam PWA[/i][/quote]`;

    navigator.clipboard
      .writeText(bb)
      .then(() => {
        playGoldCoins(audioMuted);
        showHudAlert('BBCODE COPIADO', 'Relatório para Fórum / Aliança copiado com sucesso!', '📋');
      })
      .catch(() => {});
  };

  const exportJSON = () => {
    const dados = JSON.stringify(localStorage);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ikariam_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(String(ev.target?.result || '{}'));
          for (const k of Object.keys(parsed)) {
            localStorage.setItem(k, parsed[k]);
          }
          reloadFromLocalStorage();
          showHudAlert('BACKUP RESTAURADO', 'Todos os dados JSON foram importados com sucesso!', '📂');
        } catch {
          showHudAlert('ERRO NO ARQUIVO', 'Arquivo JSON inválido.', '⚠️');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (window.confirm('Deseja realmente redefinir todos os dados para o padrão inicial?')) {
      resetAllData();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Tactical Notes */}
        <CollapsiblePanel
          title="Bloco de Notas Tático do Comandante"
          icon={<FileText className="h-4 w-4" />}
          badge={<span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Salvo Automático</span>}
          defaultOpenMobile={true}
        >
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => insertTemplate('espionagem')}
              className="rounded-lg border border-[#dcc8a6] bg-[#f7f0e0] px-2.5 py-1.5 text-xs font-bold text-[#5c4835] hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#c9d1d9]"
            >
              + Modelo Espionagem
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('ataque')}
              className="rounded-lg border border-[#dcc8a6] bg-[#f7f0e0] px-2.5 py-1.5 text-xs font-bold text-[#5c4835] hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#c9d1d9]"
            >
              + Modelo Ataque
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('tratado')}
              className="rounded-lg border border-[#dcc8a6] bg-[#f7f0e0] px-2.5 py-1.5 text-xs font-bold text-[#5c4835] hover:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#1c222b] dark:text-[#c9d1d9]"
            >
              + Modelo Tratado
            </button>
            <button
              type="button"
              onClick={copyBBCode}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300"
            >
              <Copy className="h-3 w-3" />
              <span>Exportar BBCode</span>
            </button>
          </div>

          <textarea
            rows={10}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre horários de espionagem, planos de guerra, tratados e contas do império..."
            className="w-full rounded-xl border border-[#dcc8a6] bg-white p-3 text-sm leading-relaxed text-[#24190e] outline-none focus:border-[#1b4b6b] dark:border-[#2d3440] dark:bg-[#0d1117] dark:text-[#f0f6fc]"
          />
        </CollapsiblePanel>

        {/* 2. Firebase & Backups */}
        <CollapsiblePanel
          title="Sincronização em Nuvem & Backup (Firebase)"
          icon={<Cloud className="h-4 w-4" />}
          badge={<span className="text-[11px] font-bold text-[#c99326]">myikariamlog21</span>}
          defaultOpenMobile={true}
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-[#c99326]/40 bg-[#c99326]/10 p-3.5 text-xs leading-relaxed">
              <div className="font-bold text-[#8e683f] dark:text-[#f2cc60]">
                🔥 Firestore Automático · Projeto <code>myikariamlog21</code>
              </div>
              <p className="mt-1 text-[#5c4835] dark:text-[#c9d1d9]">
                <strong>Status:</strong> {cloudStatusText}
              </p>
              <label className="mt-2.5 flex cursor-pointer items-center gap-2 font-semibold text-[#24190e] dark:text-white">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#c99326]"
                />
                Salvar alterações automaticamente em tempo real
              </label>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => syncNowToCloud(true)}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#c99326] px-3 py-2 text-xs font-bold text-white hover:bg-[#b5831f]"
              >
                <Cloud className="h-4 w-4" />
                <span>Salvar Agora na Nuvem</span>
              </button>
              <button
                type="button"
                onClick={() => pullFromCloud(true)}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#1b4b6b] px-3 py-2 text-xs font-bold text-white hover:bg-[#235d84]"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Puxar Dados da Nuvem</span>
              </button>
            </div>

            {/* Notification Settings */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#dcc8a6] bg-[#f7f0e0]/60 p-3 text-xs dark:border-[#2d3440] dark:bg-[#1c222b]">
              <div>
                <strong className="text-[#24190e] dark:text-white">🔔 Alertas do Sistema (PWA)</strong>
                <div className="text-[11px] text-[#5c4835] dark:text-[#c9d1d9]">
                  {notificationPermission === 'granted'
                    ? 'Permissão concedida · Avisos ativos'
                    : notificationPermission === 'denied'
                    ? 'Bloqueado nas configurações do navegador'
                    : notificationPermission === 'unsupported'
                    ? 'Não suportado neste navegador'
                    : 'Clique para ativar notificações de obras/timers'}
                </div>
              </div>
              {notificationPermission !== 'unsupported' && notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#1b4b6b] px-3 py-1.5 text-xs font-bold text-white"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Ativar</span>
                </button>
              )}
            </div>

            {/* Local JSON Backup & Reset */}
            <div className="grid grid-cols-1 gap-2 border-t border-[#dcc8a6]/60 pt-3 sm:grid-cols-3 dark:border-[#2d3440]">
              <button
                type="button"
                onClick={exportJSON}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#1b4b6b] px-3 py-2 text-xs font-bold text-white hover:bg-[#235d84]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exportar JSON</span>
              </button>
              <button
                type="button"
                onClick={importJSON}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#8e683f] px-3 py-2 text-xs font-bold text-white hover:bg-[#73522f]"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Restaurar JSON</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Redefinir Tudo</span>
              </button>
            </div>
          </div>
        </CollapsiblePanel>
      </div>
    </div>
  );
};
