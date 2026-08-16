import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Calc, type PriceFeed } from '../engine/calc';
import { fetchPrices } from './prices';
import { realFetch } from '../test/setup';

describe('smoke réseau AODP (requiert internet)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', realFetch);
  });

  it('récupère les prix live d\'un item et alimente le verdict', async () => {
    const map = await fetchPrices(['T4_MAIN_SWORD', 'T4_METALBAR']);
    expect(map.has('T4_MAIN_SWORD')).toBe(true);
    const byCity = map.get('T4_MAIN_SWORD')!;
    const first = [...byCity.values()][0];
    expect(first.ask[0]).toBeGreaterThan(0);
    expect(first.bid[0]).toBeGreaterThan(0);
    const feed: PriceFeed = {};
    for (const [id, cities] of map) feed[id] = [...cities.values()][0];
    const res = Calc.compute({ ...Calc.DEFAULTS, sources: { ...Calc.DEFAULTS.sources } }, feed);
    expect(res.revGross).toBeGreaterThan(0);
  }, 30_000);
});
