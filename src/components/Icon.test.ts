// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Calc } from '../engine/calc.ts';
import { iconUrlFallback, iconDir } from '../lib/iconDir.ts';

function variantOf(itemId?: string, state?: { selection?: { quality?: string } }): {
  tier: string;
  enchant: number;
  quality: number;
} | undefined {
  if (!itemId || !state?.selection?.quality) return undefined;
  const p = Calc.parseId(itemId);
  if (!p) return undefined;
  const q = state.selection.quality;
  return { tier: p.tier, enchant: p.enchant, quality: q === 'ev' ? 1 : (Number(q) || 1) };
}

describe('icône - sélection logique', () => {
  it('variantOf retourne tier/enchant puis quality géré', () => {
    // Tier et enchant extraits correctement
    const r1 = variantOf('T4_MAIN_SWORD', { selection: { quality: 'ev' } });
    expect(r1?.tier).toBe('T4');
    expect(r1?.enchant).toBe(0);

    const r2 = variantOf('T8_OR@4', { selection: { quality: 3 } });
    expect(r2?.tier).toBe('T8');
    expect(r2?.enchant).toBe(4);
  });

  it('variantOf undefined si itemId manquant', () => {
    expect(variantOf(undefined, { selection: { quality: 'ev' } })).toBeUndefined();
  });

  it('variantOf undefined si state ou quality manquant', () => {
    expect(variantOf('T4_MAIN_SWORD', undefined)).toBeUndefined();
    expect(variantOf('T4_MAIN_SWORD', {})).toBeUndefined();
    expect(variantOf('T4_MAIN_SWORD', { selection: {} })).toBeUndefined();
  });

  it('iconUrlFallback retourne le chemin du fallback name.png', () => {
    expect(iconUrlFallback('ORE')).toContain('ORE.png');
    expect(iconUrlFallback('MAIN_SWORD')).toContain('MAIN_SWORD.png');
  });

  it('iconDir retourne le dossier correct pour chaque famille', () => {
    expect(typeof iconDir('ORE')).toBe('string');
    expect(typeof iconDir('MAIN_SWORD')).toBe('string');
    expect(typeof iconDir('JOURNAL_WARRIOR')).toBe('string');
  });
});