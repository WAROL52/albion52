export const fmt = (n: number): string => Math.round(n).toLocaleString('fr-FR');

export const money = (n: number): string => `${fmt(n)} Silver`;

export const fmtTime = (sec: number): string => {
  sec = Math.round(sec || 0);
  if (sec < 60) return `${sec}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m${s ? ` ${s}s` : ''}`;
  return `${m}min ${s ? `${s}s` : ''}`.trim();
};

export const cls = (n: number): string => (n >= 0 ? 'pos' : 'neg');

export const verdict = (n: number): string => (n >= 0 ? 'Rentable' : 'Pas rentable');

export const iconUrl = (fam: string): string => `/img/T4_${fam}.png`;
