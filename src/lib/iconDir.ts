import { Calc, type Tier } from '../engine/calc.ts';

export interface IconOpts {
  tier?: Tier;
  enchant?: number;
  quality?: number;
}

const JOURNAL_ROOT = 'journaux';

export function iconDir(fam: string): string {
  const walk = (nodes: typeof Calc.CATALOG, path: string[]): string[] | null => {
    for (const n of nodes) {
      if (n.items?.includes(fam)) return [...path, n.id ?? '', fam].filter(Boolean);
      if (n.subs) {
        const r = walk(n.subs, [...path, n.id ?? '']);
        if (r) return r;
      }
    }
    return null;
  };
  const path = walk(Calc.CATALOG, []);
  if (path) return path.join('/');
  if (fam.startsWith('JOURNAL_')) {
    const prof = fam.slice('JOURNAL_'.length);
    return `${JOURNAL_ROOT}/${prof}/${fam}`;
  }
  return fam;
}

export function iconFileName(fam: string, opts?: IconOpts): string {
  if (opts?.tier && opts.enchant !== undefined && opts.quality) {
    return `${fam}.${opts.tier}.${opts.enchant}.Q${opts.quality}.png`;
  }
  return `${fam}.png`;
}

export function iconUrl(fam: string, opts?: IconOpts): string {
  return `${import.meta.env.BASE_URL}icons/${iconDir(fam)}/${iconFileName(fam, opts)}`;
}

export function iconUrlFallback(fam: string): string {
  return `${import.meta.env.BASE_URL}icons/${iconDir(fam)}/${fam}.png`;
}
