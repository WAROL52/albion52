import { describe, expect, it } from 'vitest';
import { Calc } from './calc';

const state = () => ({ ...Calc.DEFAULTS, sources: { ...Calc.DEFAULTS.sources } });

describe('prix du marché (repli prototype)', () => {
  it('fait monter le prix avec le tier et l\'enchant', () => {
    expect(Calc.priceOf('T5_ORE', 'buy', 'instant')).toBeGreaterThan(Calc.priceOf('T4_ORE', 'buy', 'instant'));
    expect(Calc.priceOf('T4_MAIN_SWORD@2', 'buy', 'instant')).toBeGreaterThan(Calc.priceOf('T4_MAIN_SWORD', 'buy', 'instant'));
  });

  it('respecte le spread bid/ask et le sens de marché', () => {
    expect(Calc.priceOf('T4_ORE', 'sell', 'instant')).toBeLessThan(Calc.priceOf('T4_ORE', 'buy', 'instant'));
    const mid = Math.round(Calc.FAMILIES.ORE.base * Calc.TIER_MULT.T4);
    expect(Calc.priceOf('T4_ORE', 'buy', 'instant')).toBe(Math.round(mid * 1.04));
    expect(Calc.priceOf('T4_ORE', 'buy', 'orders')).toBe(Math.round(mid * 0.97));
  });

  it('applique les multiplicateurs de qualité', () => {
    expect(Calc.qPrice('T4_ORE', 'sell', 5, 'instant')).toBeGreaterThan(Calc.qPrice('T4_ORE', 'sell', 1, 'instant'));
  });

  it('calcule la valeur attendue pondérée par les qualités', () => {
    const s = state();
    const ev = Calc.evPrice('T4_MAIN_SWORD', 'sell', s);
    const probs = Calc.QUALITY_PROBS.noFocus;
    let expected = 0;
    for (let q = 1; q <= 5; q++) expected += probs[q] * Calc.qPrice('T4_MAIN_SWORD', 'sell', q, 'instant');
    expect(ev).toBe(Math.round(expected));
    expect(ev).toBeLessThanOrEqual(Calc.qPrice('T4_MAIN_SWORD', 'sell', 5, 'instant'));
  });

  it('tarifie les journaux par profession et tier', () => {
    const war = Calc.priceOf('T4_JOURNAL_WARRIOR', 'buy', 'instant');
    const ore = Calc.priceOf('T4_JOURNAL_ORE', 'buy', 'instant');
    expect(war).toBeGreaterThan(0);
    expect(ore).toBeGreaterThan(0);
    expect(Calc.priceOf('T5_JOURNAL_WARRIOR', 'buy', 'instant')).toBeGreaterThan(war);
  });
});
