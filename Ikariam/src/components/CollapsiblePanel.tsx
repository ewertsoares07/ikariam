import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useImperial } from '../context/ImperialContext';
import { playStoneClick } from '../services/audioService';

interface CollapsiblePanelProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpenMobile?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  icon,
  badge,
  defaultOpenMobile = true,
  className = '',
  children,
}) => {
  const { accordionSignal, audioMuted } = useImperial();
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 860) {
      return defaultOpenMobile;
    }
    return true;
  });

  useEffect(() => {
    if (accordionSignal.seq === 0) return;
    setIsOpen(accordionSignal.mode === 'expand');
  }, [accordionSignal]);

  const handleToggle = (e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (['BUTTON', 'INPUT', 'SELECT', 'A', 'LABEL'].includes(tag)) return;
    setIsOpen((prev) => !prev);
    playStoneClick(audioMuted);
  };

  return (
    <section
      className={`rounded-xl border border-[#dcc8a6] bg-[#fffdf8] shadow-sm transition-colors dark:border-[#2d3440] dark:bg-[#161b22] ${className}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className="flex min-h-[52px] cursor-pointer select-none items-center justify-between gap-3 px-4 py-3 sm:px-5"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1b4b6b]/10 text-[#1b4b6b] dark:bg-[#3b82b6]/15 dark:text-[#60a5fa]">
              {icon}
            </span>
          )}
          <h2 className="font-display truncate text-base font-bold text-[#24190e] dark:text-[#f0f6fc]">
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <ChevronDown
            className={`h-4 w-4 text-[#7d6b56] transition-transform duration-200 dark:text-[#8b949e] ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-[#dcc8a6]/60 px-4 py-4 sm:px-5 dark:border-[#2d3440]">
          {children}
        </div>
      )}
    </section>
  );
};
