export function formatNumberDots(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num =
    typeof value === 'number'
      ? Math.floor(value)
      : parseInt(String(value).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR');
}

export function parseCleanNumber(str: string | number | null | undefined): number {
  if (typeof str === 'number') return Number.isFinite(str) ? str : 0;
  if (!str) return 0;
  return parseFloat(String(str).replace(/\./g, '').replace(/,/g, '.')) || 0;
}

export function formatCompactResource(val: number): string {
  if (val >= 1_000_000) {
    return (
      (val / 1_000_000).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + 'M'
    );
  }
  if (val >= 10_000) {
    return (
      (val / 1_000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + 'k'
    );
  }
  return Math.floor(val).toLocaleString('pt-BR');
}

export function formatCoordMask(input: string, prevValue = ''): string {
  const digits = input.replace(/[^\d]/g, '').slice(0, 4);
  const isDeleting = input.length < prevValue.length;
  if (digits.length >= 3) {
    return digits.slice(0, 2) + ':' + digits.slice(2);
  }
  if (digits.length === 2 && !isDeleting) {
    return digits + ':';
  }
  return digits;
}

export function parseCoords(str: string): { x: number; y: number } {
  if (!str || !str.includes(':')) return { x: 0, y: 0 };
  const [x, y] = str.split(':');
  return { x: parseFloat(x) || 0, y: parseFloat(y) || 0 };
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatHoursToReadable(hours: number): string {
  if (!Number.isFinite(hours) || hours >= 999) return '∞';
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remH = Math.round(hours % 24);
    return `${days}d ${remH}h`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
