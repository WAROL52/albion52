import { beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, saveSettings } from './settings';

describe('persistance des réglages', () => {
  beforeEach(() => localStorage.clear());

  it('restaure les réglages sauvegardés', () => {
    saveSettings({
      selection: { family: 'MAIN_SWORD', tier: 'T5', enchant: 2, quality: 3 },
      quantity: 250,
      focus: true,
      stationFeePct: 40,
      marketTaxPct: 8,
      journalCounted: false,
      returnNoFocus: 0.2,
      returnWithFocus: 0.65,
      sense: 'orders',
      sources: { METALBAR: 'buy' },
      sourceConfig: undefined,
    });
    const s = loadSettings();
    expect(s.selection).toEqual({ family: 'MAIN_SWORD', tier: 'T5', enchant: 2, quality: 3 });
    expect(s.quantity).toBe(250);
    expect(s.focus).toBe(true);
    expect(s.stationFeePct).toBe(40);
    expect(s.marketTaxPct).toBe(8);
    expect(s.journalCounted).toBe(false);
    expect(s.sense).toBe('orders');
    expect(s.sources.METALBAR).toBe('buy');
  });

  it('retourne les défauts quand rien n\'est sauvegardé', () => {
    const s = loadSettings();
    expect(s.quantity).toBe(100);
    expect(s.focus).toBe(false);
    expect(s.sense).toBe('instant');
    expect(s.sources.METALBAR).toBe('craft');
  });

  it('tolère un stockage corrompu', () => {
    localStorage.setItem('albion52:settings:v1', '{oops');
    const s = loadSettings();
    expect(s.quantity).toBe(100);
  });
});
