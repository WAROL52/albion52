import { describe, expect, it } from 'vitest';
import { Calc, type IngredientNode, type SourceConfig, type State } from './calc';

const state = (): State => ({ ...Calc.DEFAULTS, sources: { ...Calc.DEFAULTS.sources } });

describe('compute — coût complet et rentabilité', () => {
  it('calcule le verdict pour l\'épée T4 par défaut', () => {
    const s = state();
    const res = Calc.compute(s);
    expect(res.recipe?.id).toBe('T4_MAIN_SWORD');
    expect(res.profit).toBeCloseTo(res.revGross - res.tax - res.cost, 5);
    expect(res.secTotal).toBeGreaterThan(0);
    expect(res.cost).toBeGreaterThan(0);
    expect(res.revGross).toBeGreaterThan(0);
  });

  it('recalcule selon le tier et l\'enchantement', () => {
    const base = Calc.compute(state());
    const t5 = Calc.compute({ ...state(), selection: { family: 'MAIN_SWORD', tier: 'T5', enchant: 0, quality: 'ev' } });
    expect(t5.outId).toBe('T5_MAIN_SWORD');
    const ench = Calc.compute({ ...state(), selection: { family: 'MAIN_SWORD', tier: 'T4', enchant: 3, quality: 'ev' } });
    expect(ench.sellPerUnit).toBeGreaterThan(base.sellPerUnit);
  });

  it('respecte une qualité fixe (Q5)', () => {
    const s = state();
    const res = Calc.compute({ ...s, selection: { ...s.selection, quality: 5 } });
    expect(res.sellPerUnit).toBe(Calc.qPrice('T4_MAIN_SWORD', 'sell', 5, 'instant'));
  });

  it('détecte une ressource brute (pas de recette, coût nul)', () => {
    const s = state();
    const res = Calc.compute({ ...s, selection: { ...s.selection, family: 'ORE' } });
    expect(res.isRaw).toBe(true);
    expect(res.cost).toBe(0);
  });

  it('raffine depuis une ressource récoltée au coût du journal seul', () => {
    const s = state();
    const bar = Calc.computeRecipe(Calc.recipeFor('T4_METALBAR')!, 10, s, 0);
    const journ = Calc.priceOf('T4_JOURNAL_ORE', 'buy', 'instant') * 10;
    expect(bar.cost).toBe(journ);
    expect(bar.ingNodes[0].source).toBe('gather');
  });

  it('acheter un ingrédient coûte plus cher que le crafter depuis une ressource récoltée', () => {
    const sRef = state();
    const sBuy: State = { ...sRef, sources: { ...sRef.sources, METALBAR: 'buy' } };
    expect(Calc.compute(sBuy).node.cost).toBeGreaterThan(Calc.compute(sRef).node.cost);
  });

  it('déroule les sous-recettes (arbre récursif) avec coûts', () => {
    const s = state();
    const res = Calc.compute({ ...s, selection: { family: 'MAIN_SWORD', tier: 'T6', enchant: 2, quality: 'ev' } });
    expect(res.secTotal).toBeGreaterThan(0);
    expect(res.cost).toBeGreaterThan(0);
    const ing = res.node.ingNodes[0];
    expect(ing.item).toContain('T6_METALBAR');
    expect(ing.children.length).toBeGreaterThan(0);
  });

  it('applique le retour de ressources avec et sans focus', () => {
    const s = state();
    const withPaidOre = { ...s, sources: { ...s.sources, ORE: 'buy' } as State['sources'] };
    const noFocus = Calc.computeRecipe(Calc.recipeFor('T4_METALBAR')!, 10, withPaidOre, 0);
    const focus = Calc.computeRecipe(Calc.recipeFor('T4_METALBAR')!, 10, { ...withPaidOre, focus: true }, 0);
    expect(focus.rate).toBe(0.65);
    expect(noFocus.rate).toBe(0.2);
    expect(focus.net).toBeLessThan(noFocus.net);
  });

  it('incorpore les frais de station, la taxe et le journal', () => {
    const s = state();
    const res = Calc.compute(s);
    expect(res.fee).toBeGreaterThan(0);
    expect(res.tax).toBeGreaterThan(0);
    expect(res.journ).toBeGreaterThan(0);
    expect(res.cost).toBeCloseTo(res.rc.net + res.fee + res.journ, 5);
  });

  it('exclut le journal quand journalCounted est faux', () => {
    const s = state();
    const withJ = Calc.compute(s);
    const withoutJ = Calc.compute({ ...s, journalCounted: false });
    expect(withoutJ.journ).toBe(0);
    expect(withoutJ.cost).toBeLessThan(withJ.cost);
  });

  it('restitue le coût complet via la fonction compute', () => {
    const s = state();
    const res = Calc.compute(s);
    const craftCostPerUnit = res.node.cost / s.quantity;
    expect(res.craftCostPerUnit).toBeCloseTo(craftCostPerUnit, 5);
    expect(res.craftVsBuy).toBeCloseTo(res.buyCostPerUnit - craftCostPerUnit, 5);
  });

  it('seam : une sourceConfig injectée force l\'approvisionnement par famille', () => {
    const s = state();
    const cfg: SourceConfig = { ORE: { source: 'buy', enabled: true } };
    const base = Calc.computeRecipe(Calc.recipeFor('T4_METALBAR')!, 10, s, 0);
    const forced = Calc.computeRecipe(Calc.recipeFor('T4_METALBAR')!, 10, s, 0, undefined, Calc.sourceContext(s, cfg));
    expect(base.ingNodes[0].source).toBe('gather');
    expect(forced.ingNodes[0].source).toBe('buy');
    expect(forced.cost).toBeGreaterThan(base.cost);
  });

  it('seam : compute accepte sourceConfig en paramètre, undefined retombe sur state.sourceConfig', () => {
    const s = state();
    const cfg: SourceConfig = { ORE: { source: 'buy', enabled: true } };
    const viaParam = Calc.compute(s, undefined, Calc.sourceContext(s, cfg));
    const viaState = Calc.compute({ ...s, sourceConfig: cfg });
    expect(viaParam.node.cost).toBe(viaState.node.cost);
    expect(viaParam.node.cost).toBeGreaterThan(Calc.compute(s).node.cost);
  });

  it('propagation \'all\' : la source de la racine s\'applique à tout l\'arbre', () => {
    const s = state();
    const ctx = Calc.sourceContext(s, { MAIN_SWORD: { source: 'buy', enabled: true } }, 'all');
    const res = Calc.compute(s, undefined, ctx);
    const allBuy = (n: IngredientNode): boolean => n.source === 'buy' && n.children.every(allBuy);
    expect(res.node.ingNodes.every(allBuy)).toBe(true);
    expect(res.node.cost).toBeGreaterThan(Calc.compute(s).node.cost);
  });

  it('propagation \'parent\' : les enfants sans épingle héritent de la source du parent', () => {
    const s = state();
    const ctx = Calc.sourceContext(s, { MAIN_SWORD: { source: 'craft', enabled: true } }, 'parent');
    const res = Calc.compute(s, undefined, ctx);
    const bar = res.node.ingNodes[0];
    expect(bar.source).toBe('craft');
    expect(bar.children[0].source).toBe('buy');
    const none = Calc.compute(s);
    expect(none.node.ingNodes[0].children[0].source).toBe('gather');
  });

  it('propagation \'parent\' : une épingle enfant bat l\'héritage', () => {
    const s = state();
    const ctx = Calc.sourceContext(s, { MAIN_SWORD: { source: 'craft', enabled: true }, ORE: { source: 'gather', enabled: true } }, 'parent');
    const res = Calc.compute(s, undefined, ctx);
    const bar = res.node.ingNodes[0];
    expect(bar.source).toBe('craft');
    expect(bar.children[0].source).toBe('gather');
    expect(bar.children[0].cost).toBe(0);
  });

  it('propagation \'none\' (défaut) : chaque famille garde sa propre source', () => {
    const s = state();
    const res = Calc.compute(s);
    expect(res.node.ingNodes[0].source).toBe('craft');
    expect(res.node.ingNodes[0].children[0].source).toBe('gather');
  });

  it('recipeFor source-aware : hints reflètent les épingles utilisateur', () => {
    const s = state();
    const ctx = Calc.sourceContext(s, { METALBAR: { source: 'buy', enabled: true } });
    const rec = Calc.recipeFor('T4_MAIN_SWORD', s, ctx);
    expect(rec?.ingSources?.[0]).toBe('buy');
    expect(rec?.ingSources?.[1]).toBe('craft');
  });

  it('recipeFor source-aware : repli si la source épinglée est incompatible (gather sur raffiné)', () => {
    const s = state();
    const ctx = Calc.sourceContext(s, { METALBAR: { source: 'gather', enabled: true } });
    const rec = Calc.recipeFor('T4_MAIN_SWORD', s, ctx);
    expect(rec?.ingSources?.[0]).toBe('craft');
  });

  it('recipeFor source-aware : propagation \'all\' applique la source de l\'item à tous les ingrédients', () => {
    const s = state();
    const ctx = Calc.sourceContext(s, { MAIN_SWORD: { source: 'buy', enabled: true } }, 'all');
    const rec = Calc.recipeFor('T4_MAIN_SWORD', s, ctx);
    expect(rec?.ingSources?.every(src => src === 'buy')).toBe(true);
  });

  it('recipeFor reste structurel sans contexte (backward compatible)', () => {
    const rec = Calc.recipeFor('T4_MAIN_SWORD');
    expect(rec?.ingSources).toBeUndefined();
    expect(rec?.ingredients.length).toBe(3);
  });
});
