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

export const iconUrl = (fam: string): string => `${import.meta.env.BASE_URL}img/T4_${fam}.png`;

import { Calc } from '../engine/calc';

export const KIND_LABEL: Record<string, string> = {
  raw: 'Ressource brute',
  refined: 'Raffinage',
  craft: 'Craft',
  JOURNAL: 'Journal',
  none: 'Item',
};

export const famNameOf = (fam: string): string => {
  if (Calc.FAMILIES[fam]) return Calc.FAMILIES[fam].name;
  if (fam.indexOf('JOURNAL_') === 0) {
    const prof = fam.slice('JOURNAL_'.length);
    return Calc.JOURNAL[prof] ? Calc.JOURNAL[prof].name : fam;
  }
  return fam;
};

export const kindOf = (fam: string): string => {
  const f = Calc.FAMILIES[fam];
  if (f) return KIND_LABEL[f.kind];
  return fam.indexOf('JOURNAL_') === 0 ? KIND_LABEL.JOURNAL : KIND_LABEL.none;
};
