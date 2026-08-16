export type Tier = 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8';
export type FamilyKind = 'raw' | 'refined' | 'craft';
export type Source = 'buy' | 'craft' | 'gather';
export type SourceEntry = { source: Source | undefined; enabled: boolean };
export type SourceConfig = Record<string, SourceEntry>;
export type SourcePropagation = 'none' | 'parent' | 'all';
export type Sense = 'instant' | 'orders';
export type Quality = 'ev' | 1 | 2 | 3 | 4 | 5;

/** Contexte de résolution des sources propagé à travers l'arbre d'ingrédients */
export interface SourceContext {
  sourceConfig: SourceConfig | undefined;
  propagation: SourcePropagation;
  parentSource: Source | undefined;
  rootSource: Source | undefined;
}

export interface FamilyDef {
  name: string;
  kind: FamilyKind;
  base: number;
  timeSec?: number;
  from?: string;
  journal?: string;
  recipe?: Array<[string, number]>;
}

export interface JournalDef {
  name: string;
  base: number;
}

export interface CatalogItem {
  id?: string;
  name?: string;
  icon?: string;
  subs?: CatalogItem[];
  items?: string[];
}

export interface Selection {
  family: string;
  tier: Tier;
  enchant: number;
  quality: Quality;
}

export interface Sources {
  [family: string]: Source;
}

export interface FeedPrice {
  ask: number[];
  bid: number[];
}

export type PriceFeed = Record<string, FeedPrice>;

export interface State {
  selection: Selection;
  quantity: number;
  focus: boolean;
  stationFeePct: number;
  marketTaxPct: number;
  journalCounted: boolean;
  returnNoFocus: number;
  returnWithFocus: number;
  sense: Sense;
  sources: Sources;
  sourceConfig: Record<string, SourceEntry> | undefined;
  sourcePropagation: SourcePropagation;
  market: string;
}

export type Action =
  | { type: 'TOGGLE_FOCUS' }
  | { type: 'TOGGLE_SENSE' }
  | { type: 'TOGGLE_JOURNAL' }
  | { type: 'SET_STATION_FEE'; value: number }
  | { type: 'SET_TAX'; value: number }
  | { type: 'SET_QTY'; value: number }
  | { type: 'SET_SELECTION'; value: Partial<Selection> }
  | { type: 'SET_SOURCE'; family: string; source: Source }
  | { type: 'SET_SOURCE_PROPAGATION'; value: SourcePropagation }
  | { type: 'SET_MARKET'; value: string }
  | { type: 'RESET' };

export interface Recipe {
  id: string;
  name: string;
  type: string;
  desc: string;
  timeSec: number;
  ingredients: Array<[string, number]>;
  journal: string;
  out: string;
  quality: boolean;
  /** Source effective par ingrédient (aligned sur ingredients), remplie si recipeFor reçoit un contexte */
  ingSources?: Source[];
}

export interface IngredientNode {
  item: string;
  source: Source;
  qty: number;
  cost: number;
  timeSec: number;
  children: IngredientNode[];
  sub?: Recipe;
}

export interface RecipeNode {
  recipe: Recipe | null;
  qty: number;
  ingNodes: IngredientNode[];
  gross: number;
  rate: number;
  net: number;
  fee: number;
  journ: number;
  cost: number;
  timeSec: number;
}

export interface ComputeResult {
  recipe: Recipe | null;
  outId: string;
  isRaw: boolean;
  node: RecipeNode;
  rc: { gross: number; rate: number; net: number };
  fee: number;
  journ: number;
  cost: number;
  sellPerUnit: number;
  revGross: number;
  tax: number;
  profit: number;
  perUnitProfit: number;
  perHour: number;
  secTotal: number;
  craftCostPerUnit: number;
  buyCostPerUnit: number;
  craftVsBuy: number;
}

export interface ParsedId {
  tier: Tier;
  family: string;
  enchant: number;
}

const TIERS: Tier[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
const TIER_MULT: Record<Tier, number> = { T2: 0.35, T3: 0.55, T4: 1, T5: 1.7, T6: 2.9, T7: 5, T8: 8.5 };
const ENCHANTS = [0, 1, 2, 3, 4];
const ENCHANT_MULT: Record<number, number> = { 0: 1, 1: 1.7, 2: 3.1, 3: 5.5, 4: 9.5 };

const QUALITY_MULT: Record<number, number> = { 1: 1.0, 2: 1.4, 3: 2.0, 4: 3.0, 5: 5.0 };

const QUALITY_PROBS: Record<'noFocus' | 'withFocus', Record<number, number>> = {
  noFocus: { 1: 0.87, 2: 0.12, 3: 0.009, 4: 0.001, 5: 0.0 },
  withFocus: { 1: 0.54, 2: 0.38, 3: 0.07, 4: 0.01, 5: 0.0 },
};

const JOURNAL: Record<string, JournalDef> = {
  WARRIOR: { name: 'Journal de Guerrier', base: 34 },
  MAGE: { name: 'Journal de Mage', base: 30 },
  MERCENARY: { name: 'Journal de Mercenaire', base: 31 },
  TOOLMAKER: { name: "Journal d'Outilier", base: 29 },
  ORE: { name: 'Journal de Minerai', base: 27 },
  HIDE: { name: 'Journal de Peaux', base: 25 },
  FIBER: { name: 'Journal de Fibres', base: 24 },
  WOOD: { name: 'Journal de Bois', base: 26 },
  STONE: { name: 'Journal de Pierre', base: 26 },
};

const FAMILIES: Record<string, FamilyDef> = {
  ORE: { name: 'Minerai', kind: 'raw', base: 42 },
  HIDE: { name: 'Peaux', kind: 'raw', base: 35 },
  FIBER: { name: 'Fibres', kind: 'raw', base: 33 },
  WOOD: { name: 'Bois', kind: 'raw', base: 39 },
  ROCK: { name: 'Pierre', kind: 'raw', base: 41 },
  METALBAR: { name: 'Lingot', kind: 'refined', from: 'ORE', journal: 'ORE', base: 172, timeSec: 3 },
  LEATHER: { name: 'Cuir', kind: 'refined', from: 'HIDE', journal: 'HIDE', base: 120, timeSec: 3 },
  CLOTH: { name: 'Tissu', kind: 'refined', from: 'FIBER', journal: 'FIBER', base: 110, timeSec: 3 },
  PLANKS: { name: 'Planches', kind: 'refined', from: 'WOOD', journal: 'WOOD', base: 126, timeSec: 3 },
  STONEBLOCK: { name: 'Blocs', kind: 'refined', from: 'ROCK', journal: 'STONE', base: 131, timeSec: 3 },
  MAIN_SWORD: { name: 'Épée longue', kind: 'craft', journal: 'WARRIOR', base: 900, timeSec: 8, recipe: [['METALBAR', 8], ['LEATHER', 4], ['CLOTH', 2]] },
  MAIN_DAGGER: { name: 'Dague', kind: 'craft', journal: 'WARRIOR', base: 700, timeSec: 6, recipe: [['METALBAR', 5], ['LEATHER', 3], ['CLOTH', 2]] },
  MAIN_SPEAR: { name: 'Lance', kind: 'craft', journal: 'WARRIOR', base: 780, timeSec: 7, recipe: [['METALBAR', 6], ['LEATHER', 3], ['WOOD', 3]] },
  MAIN_AXE: { name: 'Hache', kind: 'craft', journal: 'WARRIOR', base: 820, timeSec: 7, recipe: [['METALBAR', 7], ['WOOD', 3], ['LEATHER', 2]] },
  MAIN_HAMMER: { name: 'Marteau', kind: 'craft', journal: 'WARRIOR', base: 760, timeSec: 8, recipe: [['METALBAR', 8], ['WOOD', 4]] },
  MAIN_FIRESTAFF: { name: 'Bâton de feu', kind: 'craft', journal: 'MAGE', base: 850, timeSec: 7, recipe: [['CLOTH', 6], ['WOOD', 4]] },
  MAIN_FROSTSTAFF: { name: 'Bâton de givre', kind: 'craft', journal: 'MAGE', base: 850, timeSec: 7, recipe: [['CLOTH', 6], ['WOOD', 4]] },
  MAIN_ARCANESTAFF: { name: "Bâton d'arcane", kind: 'craft', journal: 'MAGE', base: 900, timeSec: 7, recipe: [['CLOTH', 6], ['WOOD', 4]] },
  HEAD_LEATHER_SET1: { name: 'Capuche en cuir', kind: 'craft', journal: 'MERCENARY', base: 520, timeSec: 5, recipe: [['LEATHER', 5], ['CLOTH', 2]] },
  ARMOR_LEATHER_SET1: { name: 'Veste en cuir', kind: 'craft', journal: 'MERCENARY', base: 780, timeSec: 6, recipe: [['LEATHER', 8], ['CLOTH', 3]] },
  SHOES_LEATHER_SET1: { name: 'Bottes en cuir', kind: 'craft', journal: 'MERCENARY', base: 460, timeSec: 5, recipe: [['LEATHER', 4], ['CLOTH', 2]] },
  HEAD_CLOTH_SET1: { name: 'Capuche en tissu', kind: 'craft', journal: 'MAGE', base: 480, timeSec: 5, recipe: [['CLOTH', 5], ['WOOD', 2]] },
  ARMOR_CLOTH_SET1: { name: 'Robe en tissu', kind: 'craft', journal: 'MAGE', base: 720, timeSec: 6, recipe: [['CLOTH', 8], ['WOOD', 3]] },
  SHOES_CLOTH_SET1: { name: 'Bottes en tissu', kind: 'craft', journal: 'MAGE', base: 430, timeSec: 5, recipe: [['CLOTH', 4], ['WOOD', 2]] },
  HEAD_PLATE_SET1: { name: 'Casque en plaque', kind: 'craft', journal: 'WARRIOR', base: 560, timeSec: 5, recipe: [['METALBAR', 6], ['LEATHER', 2]] },
  ARMOR_PLATE_SET1: { name: 'Cuirasse', kind: 'craft', journal: 'WARRIOR', base: 880, timeSec: 7, recipe: [['METALBAR', 10], ['LEATHER', 3]] },
  SHOES_PLATE_SET1: { name: 'Bottes en plaque', kind: 'craft', journal: 'WARRIOR', base: 480, timeSec: 5, recipe: [['METALBAR', 5], ['LEATHER', 2]] },
  '2H_TOOL_PICK': { name: 'Pioche', kind: 'craft', journal: 'TOOLMAKER', base: 400, timeSec: 5, recipe: [['METALBAR', 4], ['WOOD', 3]] },
  '2H_TOOL_KNIFE': { name: 'Couteau de peau', kind: 'craft', journal: 'TOOLMAKER', base: 400, timeSec: 5, recipe: [['METALBAR', 4], ['WOOD', 3]] },
  '2H_TOOL_HAMMER': { name: 'Marteau de pierre', kind: 'craft', journal: 'TOOLMAKER', base: 400, timeSec: 5, recipe: [['METALBAR', 4], ['WOOD', 3]] },
  '2H_TOOL_SICKLE': { name: 'Faucille', kind: 'craft', journal: 'TOOLMAKER', base: 400, timeSec: 5, recipe: [['METALBAR', 4], ['WOOD', 3]] },
  '2H_TOOL_AXE': { name: 'Hache de bûcheron', kind: 'craft', journal: 'TOOLMAKER', base: 400, timeSec: 5, recipe: [['METALBAR', 4], ['WOOD', 3]] },
  BAG: { name: 'Sac', kind: 'craft', journal: 'TOOLMAKER', base: 1400, timeSec: 5, recipe: [['LEATHER', 6], ['CLOTH', 3]] },
  CAPE: { name: 'Cape', kind: 'craft', journal: 'MERCENARY', base: 1000, timeSec: 6, recipe: [['LEATHER', 5], ['CLOTH', 4]] },
  POTION_HEAL: { name: 'Potion de soin', kind: 'craft', journal: 'MAGE', base: 350, timeSec: 3, recipe: [['FIBER', 3], ['WOOD', 1]] },
};

const CATALOG: CatalogItem[] = [
  {
    id: 'weapons', name: 'Armes', icon: 'MAIN_SWORD', subs: [
      {
        id: 'melee', name: 'Mêlée', subs: [
          { id: 'swords', name: 'Épées', items: ['MAIN_SWORD'] },
          { id: 'daggers', name: 'Dagues', items: ['MAIN_DAGGER'] },
          { id: 'spears', name: 'Lances', items: ['MAIN_SPEAR'] },
          { id: 'axes', name: 'Haches', items: ['MAIN_AXE'] },
          { id: 'hammers', name: 'Marteaux', items: ['MAIN_HAMMER'] },
        ],
      },
      {
        id: 'magic', name: 'Magie', subs: [
          { id: 'fire', name: 'Bâtons de feu', items: ['MAIN_FIRESTAFF'] },
          { id: 'frost', name: 'Bâtons de givre', items: ['MAIN_FROSTSTAFF'] },
          { id: 'arcane', name: "Bâtons d'arcane", items: ['MAIN_ARCANESTAFF'] },
        ],
      },
    ],
  },
  {
    id: 'armor', name: 'Armures', icon: 'ARMOR_LEATHER_SET1', subs: [
      {
        id: 'leather', name: 'Cuir', subs: [
          { id: 'l_head', name: 'Capuches', items: ['HEAD_LEATHER_SET1'] },
          { id: 'l_body', name: 'Vestes', items: ['ARMOR_LEATHER_SET1'] },
          { id: 'l_shoe', name: 'Bottes', items: ['SHOES_LEATHER_SET1'] },
        ],
      },
      {
        id: 'cloth', name: 'Tissu', subs: [
          { id: 'c_head', name: 'Capuches', items: ['HEAD_CLOTH_SET1'] },
          { id: 'c_body', name: 'Robes', items: ['ARMOR_CLOTH_SET1'] },
          { id: 'c_shoe', name: 'Bottes', items: ['SHOES_CLOTH_SET1'] },
        ],
      },
      {
        id: 'plate', name: 'Plaque', subs: [
          { id: 'p_head', name: 'Casques', items: ['HEAD_PLATE_SET1'] },
          { id: 'p_body', name: 'Cuirasses', items: ['ARMOR_PLATE_SET1'] },
          { id: 'p_shoe', name: 'Bottes', items: ['SHOES_PLATE_SET1'] },
        ],
      },
    ],
  },
  {
    id: 'tools', name: 'Outils', icon: '2H_TOOL_PICK', subs: [
      { id: 't_pick', name: 'Pioche', items: ['2H_TOOL_PICK'] },
      { id: 't_knife', name: 'Couteau de peau', items: ['2H_TOOL_KNIFE'] },
      { id: 't_hammer', name: 'Marteau de pierre', items: ['2H_TOOL_HAMMER'] },
      { id: 't_sickle', name: 'Faucille', items: ['2H_TOOL_SICKLE'] },
      { id: 't_axe', name: 'Hache de bûcheron', items: ['2H_TOOL_AXE'] },
    ],
  },
  {
    id: 'accessories', name: 'Accessoires', icon: 'BAG', subs: [
      { id: 'a_bag', name: 'Sacs', items: ['BAG'] },
      { id: 'a_cape', name: 'Capes', items: ['CAPE'] },
    ],
  },
  { id: 'consumables', name: 'Consommables', icon: 'POTION_HEAL', items: ['POTION_HEAL'] },
  {
    id: 'resources', name: 'Ressources', icon: 'ORE', subs: [
      { id: 'r_raw', name: 'Brutes', items: ['ORE', 'HIDE', 'FIBER', 'WOOD', 'ROCK'] },
      { id: 'r_ref', name: 'Raffinées', items: ['METALBAR', 'LEATHER', 'CLOTH', 'PLANKS', 'STONEBLOCK'] },
    ],
  },
];

const GATHERABLE = Object.keys(FAMILIES).filter(f => FAMILIES[f].kind === 'raw');

const itemId = (family: string, tier: Tier, enchant = 0): string =>
  tier + '_' + family + (enchant ? '@' + enchant : '');

const parseId = (id: string): ParsedId | null => {
  const m = id.match(/^(T\d)_(.+?)(?:@(\d))?$/);
  return m ? { tier: m[1] as Tier, family: m[2], enchant: m[3] ? +m[3] : 0 } : null;
};

const isJournal = (id: string): boolean => {
  const p = parseId(id);
  return !!p && p.family.indexOf('JOURNAL_') === 0;
};

const priceOf = (id: string, side: 'buy' | 'sell', sense: Sense, feed?: PriceFeed): number => {
  const fp = feed?.[id];
  if (fp) return sense === 'instant' ? (side === 'buy' ? fp.ask[0] : fp.bid[0]) : (side === 'buy' ? fp.bid[0] : fp.ask[0]);
  const p = parseId(id);
  if (!p) return 0;
  let mid: number;
  if (isJournal(id)) {
    const prof = p.family.slice('JOURNAL_'.length);
    mid = (JOURNAL[prof] ? JOURNAL[prof].base : 300) * TIER_MULT[p.tier];
  } else {
    const f = FAMILIES[p.family];
    if (!f) return 0;
    mid = f.base * TIER_MULT[p.tier] * ENCHANT_MULT[p.enchant];
  }
  const bid = Math.round(mid * 0.97), ask = Math.round(mid * 1.04);
  if (side === 'buy') return sense === 'instant' ? ask : bid;
  return sense === 'instant' ? bid : ask;
};

const qPrice = (id: string, side: 'buy' | 'sell', q: number, sense: Sense, feed?: PriceFeed): number => {
  const fp = feed?.[id];
  if (fp) {
    const arr = sense === 'instant' ? (side === 'buy' ? fp.ask : fp.bid) : (side === 'buy' ? fp.bid : fp.ask);
    const v = arr[q - 1];
    if (v > 0) return v;
    // Qualité absente du feed (AODP ne renvoie que les qualités listées) :
    // repli sur Q1 × multiplicateur, puis sur le repli prototype
    if (arr[0] > 0) return Math.round(arr[0] * QUALITY_MULT[q]);
    return Math.round(priceOf(id, side, sense, undefined) * QUALITY_MULT[q]);
  }
  return Math.round(priceOf(id, side, sense) * QUALITY_MULT[q]);
};

const probsOf = (s: State): Record<number, number> =>
  s.focus ? QUALITY_PROBS.withFocus : QUALITY_PROBS.noFocus;

const evPrice = (id: string, side: 'buy' | 'sell', s: State, feed?: PriceFeed): number => {
  const probs = probsOf(s);
  let ev = 0;
  for (let q = 1; q <= 5; q++) ev += probs[q] * qPrice(id, side, q, s.sense, feed);
  return Math.round(ev);
};

const TYPE = { raw: 'Ressource brute', refined: 'Raffinage', craft: 'Craft' };
const KIND_DESC = {
  raw: "Ressource brute, récoltée dans les zones correspondantes. Pas de recette de craft : on la récolte ou on l'achète.",
  refined: 'Matériau raffiné à partir de la ressource brute du même tier.',
  craft: "Objet fabriqué en atelier à partir de matériaux raffinés (et d'un journal).",
};

const recipeFor = (itId: string, s?: State, ctx?: SourceContext): Recipe | null => {
  const p = parseId(itId);
  if (!p) return null;
  const f = FAMILIES[p.family];
  if (!f || f.kind === 'raw') return null;
  const mkIng = (fam: string) => itemId(fam, p.tier, p.enchant);
  let ingredients: Array<[string, number]> = [];
  if (f.kind === 'refined') ingredients = [[mkIng(f.from!), 3]];
  else if (f.recipe) ingredients = f.recipe.map(([fam, qty]) => [mkIng(fam), qty]);
  const rec: Recipe = {
    id: itId,
    name: f.name,
    type: TYPE[f.kind],
    desc: KIND_DESC[f.kind],
    timeSec: f.timeSec || 0,
    ingredients,
    journal: itemId('JOURNAL_' + f.journal, p.tier),
    out: itId,
    quality: true,
  };
  if (s && ctx) {
    // Candidat 4 : hints de source par ingrédient selon le contexte utilisateur
    const local: SourceContext = { ...ctx, parentSource: undefined };
    if (ctx.propagation === 'all' && !local.rootSource) {
      local.rootSource = nodeSource(s, itId, { ...local, rootSource: undefined });
    }
    rec.ingSources = ingredients.map(([id]) => {
      let src = nodeSource(s, id, local);
      if (!sourceOptions(id).includes(src)) src = defaultSource(parseId(id)?.family ?? '');
      return src;
    });
  }
  return rec;
};
const recipeProducing = (id: string): Recipe | null => recipeFor(id);

const usedIn = (itId: string): string[] => {
  const p = parseId(itId);
  if (!p) return [];
  const users: string[] = [];
  Object.keys(FAMILIES).forEach(f => {
    const ff = FAMILIES[f];
    if (ff.recipe && ff.recipe.some(([ing]) => ing === p.family)) users.push(f);
    else if (ff.from === p.family) users.push(f);
    else if (ff.journal && 'JOURNAL_' + ff.journal === p.family) users.push(f);
  });
  return users.map(f => itemId(f, p.tier, p.enchant));
};

const SOURCES: Record<string, Source> = { buy: 'buy', craft: 'craft', gather: 'gather' };

export const defaultSource = (fam: string): Source =>
  FAMILIES[fam].kind === 'raw' ? 'gather' : FAMILIES[fam].kind === 'refined' ? 'craft' : 'buy';

const defaultSources = (): Sources => {
  const m: Sources = {};
  Object.keys(FAMILIES).forEach(f => (m[f] = defaultSource(f)));
  Object.keys(JOURNAL).forEach(j => (m['JOURNAL_' + j] = 'buy'));
  return m;
};

/** Config par défaut : sources par défaut, non épinglées (enabled=false) → les sources legacy restent autoritaires */
const defaultSourceConfig = (): SourceConfig => {
  const m: SourceConfig = {};
  Object.keys(FAMILIES).forEach(f => (m[f] = { source: defaultSource(f), enabled: false }));
  Object.keys(JOURNAL).forEach(j => (m['JOURNAL_' + j] = { source: 'buy', enabled: false }));
  return m;
};

export const sourceOptions = (id: string): Source[] => {
  const opts: Source[] = ['buy'];
  const f = FAMILIES[parseId(id)?.family ?? ''];
  if (f && f.kind !== 'raw') opts.push('craft');
  if (f && f.kind === 'raw') opts.push('gather');
  return opts;
};

const DEFAULTS: State = {
  selection: { family: 'MAIN_SWORD', tier: 'T4', enchant: 0, quality: 'ev' },
  quantity: 100,
  focus: false,
  stationFeePct: 25,
  marketTaxPct: 4,
  journalCounted: true,
  returnNoFocus: 0.2,
  returnWithFocus: 0.65,
  sense: 'instant',
  sources: defaultSources(),
  sourceConfig: defaultSourceConfig(),
  sourcePropagation: 'none',
  market: 'ALL',
};

const sourceOf = (s: State, id: string): Source => {
  const fam = parseId(id)?.family ?? '';
  return s.sources[fam] || defaultSource(fam);
};

/** Contexte de calcul depuis l'état (le seam : injectable explicitement, sinon state.sourceConfig) */
export const sourceContext = (
  s: State,
  sourceConfig?: SourceConfig,
  propagation?: SourcePropagation,
): SourceContext => ({
  sourceConfig: sourceConfig ?? s.sourceConfig,
  propagation: propagation ?? s.sourcePropagation,
  parentSource: undefined,
  rootSource: undefined,
});

/** Résout la source d'un nœud de l'arbre : épinglée > héritage parent ('parent') > racine ('all') > legacy > default */
const nodeSource = (s: State, id: string, ctx: SourceContext): Source => {
  if (ctx.propagation === 'all' && ctx.rootSource) return ctx.rootSource;
  const entry = ctx.sourceConfig?.[parseId(id)?.family ?? ''];
  if (entry?.enabled && entry.source) return entry.source;
  if (ctx.propagation === 'parent' && ctx.parentSource) return ctx.parentSource;
  return sourceOf(s, id);
};

const MAX_DEPTH = 6;

const computeIngredient = (itemId: string, qty: number, s: State, depth: number, feed?: PriceFeed, ctx?: SourceContext): IngredientNode => {
  const c = ctx ?? sourceContext(s);
  const source = nodeSource(s, itemId, c);
  if (source === 'gather')
    return { item: itemId, source, qty, cost: 0, timeSec: 0, children: [] };
  if (source === 'craft' && depth < MAX_DEPTH) {
    const sub = recipeProducing(itemId);
    if (sub) {
      const childCtx: SourceContext = { ...c, parentSource: source };
      const node = computeRecipe(sub, qty, s, depth + 1, feed, childCtx);
      return { item: itemId, source, qty, sub, cost: node.cost, timeSec: node.timeSec, children: node.ingNodes };
    }
  }
  return { item: itemId, source: 'buy', qty, cost: priceOf(itemId, 'buy', s.sense, feed) * qty, timeSec: 0, children: [] };
};

const computeRecipe = (recipe: Recipe, qty: number, s: State, depth: number, feed?: PriceFeed, ctx?: SourceContext): RecipeNode => {
  const c = ctx ?? sourceContext(s);
  const ingNodes = recipe.ingredients.map(([id, iqty]) => computeIngredient(id, iqty * qty, s, depth, feed, c));
  const gross = ingNodes.reduce((t, n) => t + n.cost, 0);
  const rate = s.focus ? s.returnWithFocus : s.returnNoFocus;
  const net = gross * (1 - rate);
  const fee = gross * s.stationFeePct / 100;
  const journ = recipe.journal && s.journalCounted ? priceOf(recipe.journal, 'buy', s.sense, feed) * qty : 0;
  return {
    recipe,
    qty,
    ingNodes,
    gross,
    rate,
    net,
    fee,
    journ,
    cost: net + fee + journ,
    timeSec: recipe.timeSec * qty + ingNodes.reduce((t, n) => t + n.timeSec, 0),
  };
};

const compute = (s: State, feed?: PriceFeed, ctx?: SourceContext): ComputeResult => {
  const base = ctx ?? sourceContext(s);
  const sel = s.selection;
  const outId = itemId(sel.family, sel.tier, sel.enchant);
  const rootSource = nodeSource(s, outId, { ...base, rootSource: undefined, parentSource: undefined });
  const c: SourceContext = { ...base, rootSource };
  const recipe = recipeFor(outId);
  const isRaw = !recipe;
  const node = isRaw
    ? { recipe: null, qty: s.quantity, ingNodes: [], gross: 0, rate: 0, net: 0, fee: 0, journ: 0, cost: 0, timeSec: 0 }
    : computeRecipe(recipe!, s.quantity, s, 0, feed, { ...c, parentSource: rootSource });
  const sellPerUnit = sel.quality === 'ev'
    ? evPrice(outId, 'sell', s, feed)
    : qPrice(outId, 'sell', sel.quality, s.sense, feed);
  const revGross = sellPerUnit * s.quantity;
  const tax = revGross * s.marketTaxPct / 100;
  const profit = revGross - tax - node.cost;
  const secTotal = node.timeSec;
  const perHour = secTotal > 0 ? profit / (secTotal / 3600) : 0;
  const buyCostPerUnit = sel.quality === 'ev'
    ? evPrice(outId, 'buy', { ...s, sense: 'instant' }, feed)
    : qPrice(outId, 'buy', sel.quality, 'instant', feed);
  const craftVsBuy = buyCostPerUnit - node.cost / s.quantity;
  return {
    recipe, outId, isRaw, node,
    rc: { gross: node.gross, rate: node.rate, net: node.net },
    fee: node.fee, journ: node.journ, cost: node.cost,
    sellPerUnit, revGross, tax, profit,
    perUnitProfit: profit / s.quantity, perHour, secTotal,
    craftCostPerUnit: node.cost / s.quantity, buyCostPerUnit, craftVsBuy,
  };
};

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const reduce = (s: State, action: Action): State => {
  switch (action.type) {
    case 'TOGGLE_FOCUS': return { ...s, focus: !s.focus };
    case 'TOGGLE_SENSE': return { ...s, sense: s.sense === 'instant' ? 'orders' : 'instant' };
    case 'TOGGLE_JOURNAL': return { ...s, journalCounted: !s.journalCounted };
    case 'SET_STATION_FEE': return { ...s, stationFeePct: clamp(action.value, 0, 100) };
    case 'SET_TAX': return { ...s, marketTaxPct: clamp(action.value, 0, 100) };
    case 'SET_QTY': return { ...s, quantity: clamp(Math.round(action.value), 1, 10000) };
    case 'SET_SELECTION': return { ...s, selection: { ...s.selection, ...action.value } };
    case 'SET_SOURCE': {
    const newSources = { ...s.sources, [action.family]: action.source };
    // Nouveau modèle : sourceConfig optional, héritage du default si non défini
    const newSourceEntry: SourceEntry = { source: action.source, enabled: true };
    const newSourceConfig = { ...s.sourceConfig, [action.family]: newSourceEntry };
    return { ...s, sources: newSources, sourceConfig: newSourceConfig };
}
    case 'SET_SOURCE_PROPAGATION': return { ...s, sourcePropagation: action.value };
    case 'SET_MARKET': return { ...s, market: action.value };
    case 'RESET': return { ...DEFAULTS, sources: defaultSources(), sourceConfig: defaultSourceConfig() };
    default: return s;
  }
};

export const Calc = {
  DEFAULTS, TIERS, TIER_MULT, ENCHANTS, ENCHANT_MULT, QUALITY_PROBS, QUALITY_MULT,
  JOURNAL, FAMILIES, CATALOG, GATHERABLE, SOURCES,
  itemId, parseId, isJournal, priceOf, qPrice, evPrice, recipeFor, recipeProducing,
  sourceOptions, sourceOf, defaultSources, sourceContext, compute, computeRecipe, computeIngredient,
  reduce, usedIn,
};
