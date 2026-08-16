import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_MARKETS, MARKETS, getAllPrices, getFeed, isFresh, needsRefresh, setOverride } from './prices';
import { Calc } from '../engine/calc';

const seed = () => {
  localStorage.setItem('albion52:prices:v2', JSON.stringify({
    T4_ORE: {
      Caerleon: { ask: [100, 0, 0, 0, 0], bid: [95, 0, 0, 0, 0], fetchedAt: Date.now() },
      Bridgewatch: { ask: [120, 0, 0, 0, 0], bid: [110, 0, 0, 0, 0], fetchedAt: Date.now() },
    },
  }));
};

describe('prix par marché', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });

  it('getFeed sélectionne le marché choisi', () => {
    expect(getFeed('Caerleon').T4_ORE?.ask[0]).toBe(100);
    expect(getFeed('Bridgewatch').T4_ORE?.ask[0]).toBe(120);
  });

  it('getFeed \'ALL\' fusionne le meilleur ask et le meilleur bid par qualité', () => {
    const fp = getFeed(ALL_MARKETS).T4_ORE;
    expect(fp?.ask[0]).toBe(100);
    expect(fp?.bid[0]).toBe(110);
  });

  it('getFeed ne contient pas un item absent du marché choisi', () => {
    expect(getFeed('Martlock').T4_ORE).toBeUndefined();
  });

  it('getAllPrices liste les prix Q1 par marché', () => {
    const all = getAllPrices('T4_ORE');
    expect(all.Caerleon.ask[0]).toBe(100);
    expect(all.Bridgewatch.ask[0]).toBe(120);
    expect(all.Martlock.ask[0]).toBe(0);
    expect(Object.keys(all)).toEqual([...MARKETS]);
  });

  it('un override remplace tous les marchés', () => {
    setOverride('T4_ORE', 77);
    const all = getAllPrices('T4_ORE');
    expect(all.Caerleon.ask[0]).toBe(77);
    expect(all.Bridgewatch.ask[0]).toBe(77);
    expect(getFeed('Caerleon').T4_ORE?.ask[0]).toBe(77);
  });

  it('isFresh et needsRefresh dépendent du marché', () => {
    expect(isFresh('T4_ORE', 'Caerleon')).toBe(true);
    expect(isFresh('T4_ORE', 'Martlock')).toBe(false);
    expect(needsRefresh(['T4_ORE'])).toEqual([]);
    expect(needsRefresh(['T4_METALBAR'])).toEqual(['T4_METALBAR']);
  });

  it('le calcul complet utilise le marché sélectionné', () => {
    const s = { ...Calc.DEFAULTS, sources: { ...Calc.DEFAULTS.sources, ORE: 'buy' } as typeof Calc.DEFAULTS.sources };
    const feedCaerleon = getFeed('Caerleon');
    const feedBridge = getFeed('Bridgewatch');
    const resC = Calc.compute(s, feedCaerleon);
    const resB = Calc.compute(s, feedBridge);
    expect(resC.node.ingNodes[0].children[0].cost).toBeGreaterThan(0);
    expect(resC.node.ingNodes[0].children[0].cost).toBeLessThan(resB.node.ingNodes[0].children[0].cost);
  });
});