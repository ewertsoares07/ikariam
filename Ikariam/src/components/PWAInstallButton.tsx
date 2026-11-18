import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#e3b341]/50 bg-[#c99326] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#b5831f] active:scale-95"
        title="Instalar Ikariam Painel Imperial como aplicativo"
      >
        <Download className="h-3.5 w-3.5" />
        <span>{compact ? 'Instalar' : 'Instalar App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Instalar iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl border border-[#dcc8a6] bg-[#fffdf8] p-5 text-[#24190e] shadow-2xl dark:border-[#2d3440] dark:bg-[#161b22] dark:text-[#f0f6fc]">
              <div className="flex items-center justify-between border-b border-[#dcc8a6]/60 pb-3 dark:border-[#2d3440]">
                <h3 className="font-display text-base font-bold">Instalar no iPhone / iPad</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-[#7d6b56] hover:bg-black/5 dark:text-[#8b949e]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[#5c4835] dark:text-[#c9d1d9]">
                <li>1. Toque no botão <strong>Compartilhar</strong> na barra do Safari.</li>
                <li>2. Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.</li>
                <li>3. Confirme tocando em <strong>Adicionar</strong> no canto superior direito.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-[#1b4b6b] py-2.5 text-sm font-bold text-white hover:bg-[#235d84]"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
