import type { FeedPrice, PriceFeed } from '../engine/calc';
import { Calc } from '../engine/calc';

const API = 'https://europe.albion-online-data.com';
export const MARKETS = ['Caerleon', 'Bridgewatch', 'Fort_Sterling', 'Lymhurst', 'Martlock', 'Thetford', 'Black Market'] as const;
export type Market = (typeof MARKETS)[number];
export const ALL_MARKETS = 'ALL';
const QUALITIES = '1,2,3,4,5';
const TTL_MS = 15 * 60 * 1000;
const CACHE_KEY = 'albion52:prices:v2';
const OVERRIDES_KEY = 'albion52:overrides:v1';

interface CachedPrice extends FeedPrice {
  fetchedAt: number;
}

export const NO_PRICE: FeedPrice = { ask: [0, 0, 0, 0, 0], bid: [0, 0, 0, 0, 0] };

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / privé : silencieux */
  }
};

const readCache = (): Record<string, Record<string, CachedPrice>> => readJSON<Record<string, Record<string, CachedPrice>>>(CACHE_KEY, {});
const readOverrides = (): Record<string, number> => readJSON<Record<string, number>>(OVERRIDES_KEY, {});

interface AodpRow {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  buy_price_max: number;
}

const mergeRow = (acc: FeedPrice, row: AodpRow) => {
  const q = row.quality - 1;
  if (row.sell_price_min > 0) acc.ask[q] = Math.min(acc.ask[q] || Infinity, row.sell_price_min);
  if (row.buy_price_max > 0) acc.bid[q] = Math.max(acc.bid[q], row.buy_price_max);
};

const hasPrice = (fp: FeedPrice): boolean => fp.ask.some(v => v > 0) || fp.bid.some(v => v > 0);

export const fetchPrices = async (itemIds: string[], cities: string[] = [...MARKETS]): Promise<Map<string, Map<string, FeedPrice>>> => {
  const url = `${API}/api/v2/stats/prices/${itemIds.join(',')}.json?locations=${encodeURIComponent(cities.join(','))}&qualities=${QUALITIES}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AODP HTTP ${res.status}`);
  const rows = (await res.json()) as AodpRow[];
  const byItem = new Map<string, Map<string, FeedPrice>>();
  for (const row of rows) {
    let byCity = byItem.get(row.item_id);
    if (!byCity) {
      byCity = new Map<string, FeedPrice>();
      byItem.set(row.item_id, byCity);
    }
    let fp = byCity.get(row.city);
    if (!fp) {
      fp = { ask: [0, 0, 0, 0, 0], bid: [0, 0, 0, 0, 0] };
      byCity.set(row.city, fp);
    }
    mergeRow(fp, row);
  }
  for (const [id, byCity] of byItem) {
    for (const [city, fp] of byCity) if (!hasPrice(fp)) byCity.delete(city);
    if (byCity.size === 0) byItem.delete(id);
  }
  return byItem;
};

/** Fusion toutes villes : meilleur ask (min) et meilleur bid (max) par qualité */
const mergeAll = (byCity: Record<string, CachedPrice>): FeedPrice => {
  const ask = [0, 0, 0, 0, 0];
  const bid = [0, 0, 0, 0, 0];
  for (const p of Object.values(byCity)) {
    for (let q = 0; q < 5; q++) {
      if (p.ask[q] > 0) ask[q] = ask[q] === 0 ? p.ask[q] : Math.min(ask[q], p.ask[q]);
      bid[q] = Math.max(bid[q], p.bid[q]);
    }
  }
  return { ask, bid };
};

export const getFeed = (market: string): PriceFeed => {
  const cache = readCache();
  const overrides = readOverrides();
  const feed: PriceFeed = {};
  for (const [id, byCity] of Object.entries(cache)) {
    const fp = market === ALL_MARKETS ? mergeAll(byCity) : byCity[market];
    if (fp) feed[id] = { ask: [...fp.ask], bid: [...fp.bid] };
  }
  for (const [id, price] of Object.entries(overrides)) {
    feed[id] = { ask: [price, price, price, price, price], bid: [price, price, price, price, price] };
  }
  return feed;
};

/** Prix Q1 par marché pour un item (affichage) ; un override global remplace tous les marchés */
export const getAllPrices = (itemId: string): Record<string, FeedPrice> => {
  const cache = readCache();
  const byCity = cache[itemId] ?? {};
  const out: Record<string, FeedPrice> = {};
  for (const city of MARKETS) {
    const p = byCity[city];
    out[city] = p ? { ask: [...p.ask], bid: [...p.bid] } : NO_PRICE;
  }
  const ov = readOverrides()[itemId];
  if (ov !== undefined) {
    for (const city of MARKETS) out[city] = { ask: [ov, ov, ov, ov, ov], bid: [ov, ov, ov, ov, ov] };
  }
  return out;
};

const itemAge = (byCity: Record<string, CachedPrice> | undefined, market: string): number | null => {
  if (!byCity) return null;
  if (market === ALL_MARKETS) {
    const ts = Object.values(byCity).map(p => p.fetchedAt);
    return ts.length ? Date.now() - Math.min(...ts) : null;
  }
  const e = byCity[market];
  return e ? Date.now() - e.fetchedAt : null;
};

export const getAgeMs = (itemId: string, market: string): number | null => itemAge(readCache()[itemId], market);

export const isFresh = (itemId: string, market: string): boolean => {
  const age = getAgeMs(itemId, market);
  return age !== null && age < TTL_MS;
};

export const refresh = async (itemIds: string[], market: string = ALL_MARKETS): Promise<PriceFeed> => {
  const cache = readCache();
  const stale: string[] = [];
  for (const id of itemIds) {
    const byCity = cache[id];
    if (!byCity) { stale.push(id); continue; }
    const ts = Object.values(byCity).map(p => p.fetchedAt);
    if (ts.length === 0 || Date.now() - Math.max(...ts) >= TTL_MS) stale.push(id);
  }
  if (stale.length > 0) {
    try {
      const map = await fetchPrices(stale);
      const now = Date.now();
      for (const [id, byCity] of map) {
        const existing = cache[id] ?? {};
        for (const [city, fp] of byCity) existing[city] = { ...fp, fetchedAt: now };
        cache[id] = existing;
      }
      writeJSON(CACHE_KEY, cache);
    } catch {
      // hors-ligne / erreur AODP : on garde la dernière valeur connue
    }
  }
  return getFeed(market);
};

export const setOverride = (itemId: string, price: number) => {
  const o = readOverrides();
  o[itemId] = price;
  writeJSON(OVERRIDES_KEY, o);
};

export const clearOverride = (itemId: string) => {
  const o = readOverrides();
  delete o[itemId];
  writeJSON(OVERRIDES_KEY, o);
};

export const needsRefresh = (itemIds: string[]): string[] => {
  const cache = readCache();
  return itemIds.filter(id => {
    const byCity = cache[id];
    if (!byCity) return true;
    const ts = Object.values(byCity).map(p => p.fetchedAt);
    return ts.length === 0 || Date.now() - Math.max(...ts) >= TTL_MS;
  });
};

export const priceIdsFor = (outId: string): string[] => {
  const ids = new Set<string>();
  const walk = (id: string) => {
    if (ids.has(id)) return;
    ids.add(id);
    const recipe = Calc.recipeFor(id);
    if (recipe) {
      recipe.ingredients.forEach(([ing]) => walk(ing));
      if (recipe.journal) ids.add(recipe.journal);
    }
  };
  walk(outId);
  return [...ids];
};

export { TTL_MS };