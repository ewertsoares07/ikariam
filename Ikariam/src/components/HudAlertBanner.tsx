import React from 'react';
import { X } from 'lucide-react';
import { useImperial } from '../context/ImperialContext';

export const HudAlertBanner: React.FC = () => {
  const { hudAlert, dismissHudAlert } = useImperial();

  if (!hudAlert) return null;

  return (
    <div className="fixed top-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-start gap-3 rounded-xl border border-[#e3b341] bg-[#163a52]/95 px-4 py-3 text-white shadow-xl backdrop-blur-md dark:bg-[#1c222b]/95">
        <span className="mt-0.5 text-xl leading-none">{hudAlert.icone}</span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-xs font-extrabold tracking-wide text-[#f2cc60] uppercase">
            {hudAlert.titulo}
          </div>
          <p className="mt-0.5 text-xs leading-snug text-white/90">{hudAlert.desc}</p>
        </div>
        <button
          type="button"
          onClick={dismissHudAlert}
          className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Fechar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
