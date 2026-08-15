import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPrices, getAgeMs, getFeed, isFresh, needsRefresh, priceIdsFor, refresh, setOverride, clearOverride } from './prices';

const row = (item_id: string, quality: number, sell: number, bid: number) => ({
  item_id, quality, sell_price_min: sell, sell_price_max: sell,
  buy_price_min: bid, buy_price_max: bid,
});

describe('couche AODP (fetch mocké)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.setSystemTime(new Date('2026-08-15T10:00:00Z'));
  });

  it('parse la réponse AODP multi-items/multi-villes par qualité (min ask, max bid)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        row('T4_ORE', 1, 100, 90),
        row('T4_ORE', 1, 120, 95),
        row('T4_ORE', 2, 140, 130),
        row('T4_MAIN_SWORD', 1, 900, 850),
      ],
    }));
    const map = await fetchPrices(['T4_ORE', 'T4_MAIN_SWORD']);
    expect(map.get('T4_ORE')).toEqual({ ask: [100, 140, 0, 0, 0], bid: [95, 130, 0, 0, 0] });
    expect(map.get('T4_MAIN_SWORD')).toEqual({ ask: [900, 0, 0, 0, 0], bid: [850, 0, 0, 0, 0] });
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(call).toContain('/api/v2/stats/prices/T4_ORE,T4_MAIN_SWORD.json');
    expect(call).toContain('qualities=1,2,3,4,5');
    expect(call).toContain('Caerleon');
  });

  it('met en cache 15 min et expose l\'âge de la donnée', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [row('T4_ORE', 1, 100, 90)],
    }));
    await refresh(['T4_ORE']);
    expect(getFeed().T4_ORE.ask[0]).toBe(100);
    expect(getAgeMs('T4_ORE')).toBe(0);
    expect(isFresh('T4_ORE')).toBe(true);

    vi.setSystemTime(new Date('2026-08-15T10:14:59Z'));
    expect(isFresh('T4_ORE')).toBe(true);
    vi.setSystemTime(new Date('2026-08-15T10:15:00Z'));
    expect(isFresh('T4_ORE')).toBe(false);
    expect(needsRefresh(['T4_ORE'])).toEqual(['T4_ORE']);
  });

  it('ne refetch pas les items encore frais', async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, json: async () => [row('T4_ORE', 1, 100, 90)] });
    vi.stubGlobal('fetch', fn);
    await refresh(['T4_ORE']);
    await refresh(['T4_ORE']);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retombe sur la dernière valeur connue quand AODP échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [row('T4_ORE', 1, 100, 90)],
    }));
    await refresh(['T4_ORE']);

    vi.setSystemTime(new Date('2026-08-15T10:20:00Z'));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const feed = await refresh(['T4_ORE']);
    expect(feed.T4_ORE.ask[0]).toBe(100);
    expect(getAgeMs('T4_ORE')).toBe(20 * 60 * 1000);
  });

  it('un override global remplace le prix auto et ne s\'expire jamais', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [row('T4_ORE', 1, 100, 90)],
    }));
    await refresh(['T4_ORE']);
    setOverride('T4_ORE', 500);
    expect(getFeed().T4_ORE).toEqual({ ask: [500, 500, 500, 500, 500], bid: [500, 500, 500, 500, 500] });

    vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));
    expect(getFeed().T4_ORE.ask[0]).toBe(500);
    clearOverride('T4_ORE');
    expect(getFeed().T4_ORE.ask[0]).toBe(100);
  });

  it('sans cache ni override, le feed est vide (repli moteur prototype)', () => {
    expect(getFeed()).toEqual({});
  });

  it('ignore un item sans aucun prix actif (repli moteur prototype)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        row('T4_JOURNAL_WARRIOR', 1, 0, 0),
        row('T4_JOURNAL_WARRIOR', 2, 0, 0),
        row('T4_ORE', 1, 100, 90),
      ],
    }));
    const map = await fetchPrices(['T4_JOURNAL_WARRIOR', 'T4_ORE']);
    expect(map.has('T4_JOURNAL_WARRIOR')).toBe(false);
    expect(map.get('T4_ORE')?.ask[0]).toBe(100);
  });

  it('collecte les ids de prix d\'une sélection (out + ingrédients + journaux)', () => {
    const ids = priceIdsFor('T4_MAIN_SWORD');
    expect(ids).toContain('T4_MAIN_SWORD');
    expect(ids).toContain('T4_METALBAR');
    expect(ids).toContain('T4_LEATHER');
    expect(ids).toContain('T4_CLOTH');
    expect(ids).toContain('T4_JOURNAL_WARRIOR');
    expect(ids).toContain('T4_ORE');
    const raw = priceIdsFor('T4_ORE');
    expect(raw).toEqual(['T4_ORE']);
  });
});
