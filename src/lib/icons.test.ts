// @vitest-environment node
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Calc } from '../engine/calc';
import { iconUrl } from './format';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));

const iconFile = (fam: string): string => `${publicDir}/img/T4_${fam}.png`;

describe('icônes d\'items', () => {
  it('iconUrl préfixe par le base path (BASE_URL)', () => {
    expect(iconUrl('ORE')).toBe(`${import.meta.env.BASE_URL}img/T4_ORE.png`);
    expect(import.meta.env.BASE_URL.startsWith('/')).toBe(true);
  });

  it('chaque famille du moteur a son fichier d\'icône', () => {
    const missing = Object.keys(Calc.FAMILIES).filter(fam => !existsSync(iconFile(fam)));
    expect(missing).toEqual([]);
  });

  it('chaque journal du moteur a son fichier d\'icône', () => {
    const missing = Object.keys(Calc.JOURNAL).filter(prof => !existsSync(iconFile(`JOURNAL_${prof}`)));
    expect(missing).toEqual([]);
  });

  it('chaque item référencé dans le catalogue a un fichier d\'icône', () => {
    const walk = (nodes: typeof Calc.CATALOG): string[] =>
      nodes.flatMap(n => [...(n.items ?? []), ...walk(n.subs ?? [])]);
    const fams = [...new Set(walk(Calc.CATALOG))];
    const missing = fams.filter(fam => !existsSync(iconFile(fam)));
    expect(missing).toEqual([]);
  });
});
