import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Calc } from '../engine/calc';
import { fetchPrices } from './prices';
import { realFetch } from '../test/setup';

describe('smoke réseau AODP (requiert internet)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', realFetch);
  });

  it('récupère les prix live d\'un item et alimente le verdict', async () => {
    const map = await fetchPrices(['T4_MAIN_SWORD', 'T4_METALBAR']);
    expect(map.has('T4_MAIN_SWORD')).toBe(true);
    const sword = map.get('T4_MAIN_SWORD')!;
    expect(sword.ask[0]).toBeGreaterThan(0);
    expect(sword.bid[0]).toBeGreaterThan(0);
    const feed = Object.fromEntries(map);
    const res = Calc.compute({ ...Calc.DEFAULTS, sources: { ...Calc.DEFAULTS.sources } }, feed);
    expect(res.revGross).toBeGreaterThan(0);
  }, 30_000);
});
