import { describe, expect, it } from 'vitest';
import { Calc } from './calc';

const state = () => ({ ...Calc.DEFAULTS, sources: { ...Calc.DEFAULTS.sources } });

const feed = () => ({
  T4_MAIN_SWORD: { ask: [1000, 1400, 2000, 3000, 5000], bid: [950, 1330, 1900, 2850, 4750] },
  T4_ORE: { ask: [100, 140, 200, 300, 500], bid: [95, 133, 190, 285, 475] },
});

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

describe('prix du marché (feed AODP injecté)', () => {
  it('utilise le prix du feed par qualité quand disponible', () => {
    const f = feed();
    expect(Calc.qPrice('T4_MAIN_SWORD', 'sell', 3, 'instant', f)).toBe(1900);
    expect(Calc.qPrice('T4_MAIN_SWORD', 'buy', 1, 'instant', f)).toBe(1000);
    expect(Calc.qPrice('T4_MAIN_SWORD', 'sell', 1, 'orders', f)).toBe(1000);
    expect(Calc.qPrice('T4_MAIN_SWORD', 'buy', 1, 'orders', f)).toBe(950);
  });

  it('fait retomber sur le repli prototype quand l\'item est absent du feed', () => {
    const f = feed();
    expect(Calc.priceOf('T5_MAIN_SWORD', 'buy', 'instant', f)).toBe(Calc.priceOf('T5_MAIN_SWORD', 'buy', 'instant'));
  });

  it('repli Q1 × multiplicateur quand une qualité est absente du feed', () => {
    const f = { T4_MAIN_SWORD: { ask: [1000, 0, 0, 0, 0], bid: [950, 0, 0, 0, 0] } };
    expect(Calc.qPrice('T4_MAIN_SWORD', 'sell', 1, 'instant', f)).toBe(950);
    expect(Calc.qPrice('T4_MAIN_SWORD', 'sell', 3, 'instant', f)).toBe(Math.round(950 * Calc.QUALITY_MULT[3]));
    expect(Calc.qPrice('T4_MAIN_SWORD', 'sell', 5, 'instant', f)).toBe(Math.round(950 * Calc.QUALITY_MULT[5]));
  });

  it('EV non faussée quand seules certaines qualités sont cotées', () => {
    const f = { T4_MAIN_SWORD: { ask: [1000, 0, 0, 0, 0], bid: [950, 0, 0, 0, 0] } };
    const ev = Calc.evPrice('T4_MAIN_SWORD', 'sell', state(), f);
    const probs = Calc.QUALITY_PROBS.noFocus;
    let expected = 0;
    for (let q = 1; q <= 5; q++) expected += probs[q] * Math.round(950 * Calc.QUALITY_MULT[q]);
    expect(ev).toBe(Math.round(expected));
    expect(ev).toBeGreaterThan(0);
  });

  it('calcule l\'EV pondérée à partir des prix du feed', () => {
    const s = state();
    const ev = Calc.evPrice('T4_MAIN_SWORD', 'sell', s, feed());
    const probs = Calc.QUALITY_PROBS.noFocus;
    let expected = 0;
    for (let q = 1; q <= 5; q++) expected += probs[q] * Calc.qPrice('T4_MAIN_SWORD', 'sell', q, 'instant', feed());
    expect(ev).toBe(Math.round(expected));
  });

  it('propulse les prix du feed dans le coût complet (compute)', () => {
    const st = state();
    const s = { ...st, sources: { ...st.sources, METALBAR: 'buy' } as typeof st.sources };
    const f = feed();
    const res = Calc.compute(s, f);
    expect(res.revGross).toBeGreaterThan(0);
    const ing = res.node.ingNodes[0];
    expect(ing.item).toBe('T4_METALBAR');
    expect(ing.source).toBe('buy');
    expect(ing.cost).toBe(Calc.priceOf('T4_METALBAR', 'buy', 'instant', f) * s.quantity * 8);
  });

  it('reste inchangé sans feed (repli prototype par défaut)', () => {
    const s = state();
    expect(Calc.compute(s).sellPerUnit).toBe(Calc.compute(s, {}).sellPerUnit);
  });
});
