import type { FeedPrice, PriceFeed } from '../engine/calc';
import { Calc } from '../engine/calc';

const API = 'https://europe.albion-online-data.com';
const LOCATIONS = 'Caerleon,Bridgewatch,Fort_Sterling,Lymhurst,Martlock,Thetford';
const QUALITIES = '1,2,3,4,5';
const TTL_MS = 15 * 60 * 1000;
const CACHE_KEY = 'albion52:prices:v1';
const OVERRIDES_KEY = 'albion52:overrides:v1';

interface CachedPrice extends FeedPrice {
  fetchedAt: number;
}

const NO_PRICE: FeedPrice = { ask: [0, 0, 0, 0, 0], bid: [0, 0, 0, 0, 0] };

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

const readCache = (): Record<string, CachedPrice> => readJSON<Record<string, CachedPrice>>(CACHE_KEY, {});
const readOverrides = (): Record<string, number> => readJSON<Record<string, number>>(OVERRIDES_KEY, {});

interface AodpRow {
  item_id: string;
  quality: number;
  sell_price_min: number;
  buy_price_max: number;
}

const mergeRow = (acc: FeedPrice, row: AodpRow) => {
  const q = row.quality - 1;
  if (row.sell_price_min > 0) acc.ask[q] = Math.min(acc.ask[q] || Infinity, row.sell_price_min);
  if (row.buy_price_max > 0) acc.bid[q] = Math.max(acc.bid[q], row.buy_price_max);
};

const rowToFeed = (rows: AodpRow[]): Map<string, FeedPrice> => {
  const map = new Map<string, FeedPrice>();
  for (const row of rows) {
    let fp = map.get(row.item_id);
    if (!fp) {
      fp = { ask: [0, 0, 0, 0, 0], bid: [0, 0, 0, 0, 0] };
      map.set(row.item_id, fp);
    }
    mergeRow(fp, row);
  }
  for (const [id, fp] of map) {
    const hasPrice = fp.ask.some(v => v > 0) || fp.bid.some(v => v > 0);
    if (!hasPrice) map.delete(id);
  }
  return map;
};

export const fetchPrices = async (itemIds: string[]): Promise<Map<string, FeedPrice>> => {
  const url = `${API}/api/v2/stats/prices/${itemIds.join(',')}.json?locations=${LOCATIONS}&qualities=${QUALITIES}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AODP HTTP ${res.status}`);
  const rows = (await res.json()) as AodpRow[];
  return rowToFeed(rows);
};

export const getFeed = (): PriceFeed => {
  const cache = readCache();
  const overrides = readOverrides();
  const feed: PriceFeed = {};
  for (const [id, p] of Object.entries(cache)) {
    feed[id] = {
      ask: [...p.ask],
      bid: [...p.bid],
    };
  }
  for (const [id, price] of Object.entries(overrides)) {
    feed[id] = {
      ask: [price, price, price, price, price],
      bid: [price, price, price, price, price],
    };
  }
  return feed;
};

export const getAgeMs = (itemId: string): number | null => {
  const p = readCache()[itemId];
  return p ? Date.now() - p.fetchedAt : null;
};

export const isFresh = (itemId: string): boolean => {
  const age = getAgeMs(itemId);
  return age !== null && age < TTL_MS;
};

export const refresh = async (itemIds: string[]): Promise<PriceFeed> => {
  const cache = readCache();
  const fresh: string[] = [];
  const stale: string[] = [];
  for (const id of itemIds) {
    const p = cache[id];
    if (p && Date.now() - p.fetchedAt < TTL_MS) fresh.push(id);
    else stale.push(id);
  }
  if (stale.length > 0) {
    try {
      const map = await fetchPrices(stale);
      const now = Date.now();
      for (const [id, fp] of map) {
        cache[id] = { ...fp, fetchedAt: now };
      }
      writeJSON(CACHE_KEY, cache);
    } catch {
      // hors-ligne / erreur AODP : on garde la dernière valeur connue
    }
  }
  void fresh;
  return getFeed();
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
    const p = cache[id];
    return !p || Date.now() - p.fetchedAt >= TTL_MS;
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

export { NO_PRICE, TTL_MS };
