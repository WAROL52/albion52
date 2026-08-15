// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeAll } from 'vitest';
import { Calc } from '../engine/calc.ts';
import { iconDir } from './iconDir.ts';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));
const ICON_DIR = join(publicDir, 'icons');

// Chargement du manifest au beforeAll (syntaxe ESM-safe via readFileSync + JSON.parse)
let manifest: Record<string, string[]> = {};
beforeAll(() => {
  manifest = JSON.parse(readFileSync(join(ICON_DIR, 'manifest.json'), 'utf-8'));
});

function familyIconPath(fam: string, file: string): string {
  return join(ICON_DIR, iconDir(fam), file);
}

describe('icônes d\'items - vérification complète', () => {
  it('chaque famille du moteur a son dossier + fallback name.png', () => {
    for (const fam of [...Object.keys(Calc.FAMILIES), ...Object.keys(Calc.JOURNAL).map(p => `JOURNAL_${p}`)]) {
      const fallbackPath = familyIconPath(fam, `${fam}.png`);
      expect(existsSync(fallbackPath)).toBe(true);
    }
  });

  it('chaque fichier variant téléchargé correspond à une famille valide et existe sur disque', () => {
    for (const [fam, files] of Object.entries(manifest)) {
      const isJournal = fam.startsWith('JOURNAL_');
      for (const f of files) {
        const m = f.match(/^(.+)\.T(\d+)\.(\d+)\.Q(\d+)\.png$/);
        expect(m).toBeTruthy();
        if (!m) continue;
        const [, family, _tier, _enchant, _quality] = m;
        const validFamily = Calc.FAMILIES[family] || (isJournal && Calc.JOURNAL[family.slice('JOURNAL_'.length)]);
        expect(validFamily).toBeTruthy();
        const expectedPath = familyIconPath(fam, f);
        expect(existsSync(expectedPath)).toBe(true);
      }
    }
  });

  it('toutes les combinaisons tier/enchant/quality ont soit un fichier, soit le fallback', () => {
    for (const fam of [...Object.keys(Calc.FAMILIES), ...Object.keys(Calc.JOURNAL).map(p => `JOURNAL_${p}`)]) {
      const fallbackPath = familyIconPath(fam, `${fam}.png`);
      const fallbackExists = existsSync(fallbackPath);

      for (const tier of Calc.TIERS) {
        for (const enchant of Calc.ENCHANTS) {
          for (let quality = 1; quality <= 5; quality++) {
            const variantPath = familyIconPath(fam, `${fam}.${tier}.${enchant}.Q${quality}.png`);
            const variantExists = existsSync(variantPath);
            expect(variantExists || fallbackExists).toBe(true);
          }
        }
      }
    }
  });

  it('aucun fichier PNG n est vide ou corrompu (min 100 octets)', () => {
    for (const fam of [...Object.keys(Calc.FAMILIES), ...Object.keys(Calc.JOURNAL).map(p => `JOURNAL_${p}`)]) {
      const fallbackPath = familyIconPath(fam, `${fam}.png`);
      expect(existsSync(fallbackPath)).toBe(true);
      const fallbackSize = statSync(fallbackPath).size;
      expect(fallbackSize).toBeGreaterThanOrEqual(100);

      // Vérifier quelques variantes aussi
      for (const tier of Calc.TIERS.slice(0, 3)) {
        for (const enchant of [0, 1]) {
          for (let quality = 1; quality <= 2; quality++) {
            const variantPath = familyIconPath(fam, `${fam}.${tier}.${enchant}.Q${quality}.png`);
            if (existsSync(variantPath)) {
              const size = statSync(variantPath).size;
              expect(size).toBeGreaterThanOrEqual(100);
            }
          }
        }
      }
    }
  });
});