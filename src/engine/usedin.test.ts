import { describe, expect, it } from 'vitest';
import { Calc } from './calc';

describe('usedIn — inverse des recettes', () => {
  it('trouve les utilisateurs d\'une ressource (raffinage)', () => {
    const used = Calc.usedIn('T4_ORE');
    expect(used).toContain('T4_METALBAR');
    expect(used.length).toBeGreaterThanOrEqual(1);
  });

  it('respecte le tier', () => {
    const used = Calc.usedIn('T5_ORE');
    expect(used).toContain('T5_METALBAR');
    expect(used).not.toContain('T4_METALBAR');
  });

  it('trouve les consommateurs d\'un journal', () => {
    const used = Calc.usedIn('T4_JOURNAL_WARRIOR');
    expect(used).toContain('T4_MAIN_SWORD');
    expect(used).toContain('T4_MAIN_HAMMER');
  });

  it('retourne vide pour un objet fini', () => {
    expect(Calc.usedIn('T4_BAG')).toEqual([]);
  });

  it('compte les usages du lingot (raffinés inclus, sac exclu)', () => {
    const used = Calc.usedIn('T4_METALBAR');
    expect(used).toContain('T4_MAIN_SWORD');
    expect(used).not.toContain('T4_BAG');
    expect(used.length).toBeGreaterThanOrEqual(10);
  });
});
