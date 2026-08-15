import { describe, expect, it } from 'vitest';
import { Calc } from './calc';

describe('catalogue et recettes', () => {
  it('expose le moteur pur', () => {
    expect(typeof Calc.compute).toBe('function');
    expect(typeof Calc.recipeFor).toBe('function');
  });

  it('identifie les items (tier, enchant, 2H)', () => {
    expect(Calc.itemId('MAIN_SWORD', 'T4', 0)).toBe('T4_MAIN_SWORD');
    expect(Calc.itemId('MAIN_SWORD', 'T5', 2)).toBe('T5_MAIN_SWORD@2');
    const p = Calc.parseId('T5_MAIN_SWORD@2');
    expect(p).toEqual({ tier: 'T5', family: 'MAIN_SWORD', enchant: 2 });
    expect(Calc.parseId('T4_2H_TOOL_PICK')?.family).toBe('2H_TOOL_PICK');
    expect(Calc.isJournal('T4_JOURNAL_WARRIOR')).toBe(true);
  });

  it('génère les recettes de raffinage et de craft', () => {
    expect(Calc.recipeFor('T4_ORE')).toBeNull();
    const refine = Calc.recipeFor('T5_METALBAR');
    expect(refine?.type).toBe('Raffinage');
    expect(refine?.ingredients).toEqual([['T5_ORE', 3]]);
    const sword = Calc.recipeFor('T5_MAIN_SWORD@2');
    expect(sword?.ingredients).toHaveLength(3);
    expect(sword?.ingredients[0]).toEqual(['T5_METALBAR@2', 8]);
    expect(sword?.journal).toBe('T5_JOURNAL_WARRIOR');
  });

  it('génère une recette pour toutes les familles non brutes', () => {
    for (const [fam, def] of Object.entries(Calc.FAMILIES)) {
      if (def.kind === 'raw') continue;
      const r = Calc.compute({ ...Calc.DEFAULTS, selection: { family: fam, tier: 'T4', enchant: 0, quality: 'ev' } });
      expect(r.recipe, fam).not.toBeNull();
      expect(r.recipe!.ingredients.length, fam).toBeGreaterThan(0);
    }
  });

  it('ne plante pas sur l\'exhaustif tier × enchant', () => {
    for (const tier of Calc.TIERS)
      for (const en of Calc.ENCHANTS) {
        const r = Calc.compute({
          ...Calc.DEFAULTS,
          selection: { family: 'MAIN_FIRESTAFF', tier, enchant: en, quality: 'ev' },
        });
        expect(r.recipe, `${tier}@${en}`).not.toBeNull();
      }
  });

  it('expose le catalogue de navigation à 3 niveaux', () => {
    expect(Calc.CATALOG.some(c => c.id === 'weapons')).toBe(true);
    const weapons = Calc.CATALOG.find(c => c.id === 'weapons');
    expect(weapons!.subs!.some(s => s.id === 'melee')).toBe(true);
    expect(weapons!.subs!.find(s => s.id === 'melee')!.subs!.some(s => s.id === 'swords')).toBe(true);
    expect(Calc.CATALOG.some(c => c.id === 'resources')).toBe(true);
  });

  it('résout les sources valides par type de famille', () => {
    expect(Calc.sourceOptions('T4_ORE')).toEqual(expect.arrayContaining(['buy', 'gather']));
    expect(Calc.sourceOptions('T4_ORE')).not.toContain('craft');
    expect(Calc.sourceOptions('T4_METALBAR')).toEqual(expect.arrayContaining(['buy', 'craft']));
    expect(Calc.sourceOptions('T4_METALBAR')).not.toContain('gather');
    expect(Calc.sourceOptions('T4_MAIN_SWORD')).toContain('craft');
  });
});
