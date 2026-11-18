import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-3 z-40 flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-lg md:bottom-4">
      <WifiOff className="h-3.5 w-3.5 shrink-0 animate-pulse" />
      <span>Modo Offline · Alterações salvas localmente</span>
    </div>
  );
};
