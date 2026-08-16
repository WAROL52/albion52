import { describe, expect, it } from 'vitest';
import { Calc, type State } from './calc';

const state = (): State => ({ ...Calc.DEFAULTS, sources: { ...Calc.DEFAULTS.sources } });

describe('reduce — actions et clamps', () => {
  it('bascule focus, sens de marché et journal', () => {
    let s = state();
    s = Calc.reduce(s, { type: 'TOGGLE_FOCUS' });
    expect(s.focus).toBe(true);
    s = Calc.reduce(s, { type: 'TOGGLE_SENSE' });
    expect(s.sense).toBe('orders');
    s = Calc.reduce(s, { type: 'TOGGLE_JOURNAL' });
    expect(s.journalCounted).toBe(false);
  });

  it('borne les frais de station et la taxe à 0–100', () => {
    let s = state();
    s = Calc.reduce(s, { type: 'SET_STATION_FEE', value: 150 });
    expect(s.stationFeePct).toBe(100);
    s = Calc.reduce(s, { type: 'SET_STATION_FEE', value: -5 });
    expect(s.stationFeePct).toBe(0);
    s = Calc.reduce(s, { type: 'SET_TAX', value: 101 });
    expect(s.marketTaxPct).toBe(100);
  });

  it('borne la quantité à 1–10000 et arrondit', () => {
    let s = state();
    s = Calc.reduce(s, { type: 'SET_QTY', value: 250 });
    expect(s.quantity).toBe(250);
    s = Calc.reduce(s, { type: 'SET_QTY', value: 99999 });
    expect(s.quantity).toBe(10000);
    s = Calc.reduce(s, { type: 'SET_QTY', value: 0 });
    expect(s.quantity).toBe(1);
    s = Calc.reduce(s, { type: 'SET_QTY', value: 10.6 });
    expect(s.quantity).toBe(11);
  });

  it('met à jour la sélection et les sources', () => {
    let s = state();
    s = Calc.reduce(s, { type: 'SET_SELECTION', value: { tier: 'T8' } });
    expect(s.selection.tier).toBe('T8');
    expect(s.selection.family).toBe('MAIN_SWORD');
    s = Calc.reduce(s, { type: 'SET_SOURCE', family: 'METALBAR', source: 'buy' });
    expect(s.sources.METALBAR).toBe('buy');
  });

  it('reset rétablit les défauts et les sources', () => {
    const s = Calc.reduce(
      Calc.reduce(state(), { type: 'SET_SELECTION', value: { tier: 'T8', family: 'BAG' } }),
      { type: 'RESET' },
    );
    expect(s.selection.tier).toBe('T4');
    expect(s.selection.family).toBe('MAIN_SWORD');
    expect(s.sources.METALBAR).toBe('craft');
    expect(s.sources['JOURNAL_WARRIOR']).toBe('buy');
  });

  it('définit et réinitialise la propagation de source', () => {
    let s = Calc.reduce(state(), { type: 'SET_SOURCE_PROPAGATION', value: 'all' });
    expect(s.sourcePropagation).toBe('all');
    s = Calc.reduce(s, { type: 'SET_SOURCE_PROPAGATION', value: 'parent' });
    expect(s.sourcePropagation).toBe('parent');
    s = Calc.reduce(s, { type: 'RESET' });
    expect(s.sourcePropagation).toBe('none');
  });

  it('les valeurs par défaut respectent la spec', () => {
    const d = Calc.DEFAULTS;
    expect(d.quantity).toBe(100);
    expect(d.focus).toBe(false);
    expect(d.stationFeePct).toBe(25);
    expect(d.marketTaxPct).toBe(4);
    expect(d.journalCounted).toBe(true);
    expect(d.returnNoFocus).toBe(0.2);
    expect(d.returnWithFocus).toBe(0.65);
    expect(d.sense).toBe('instant');
    expect(d.selection.quality).toBe('ev');
    expect(d.sourcePropagation).toBe('none');
  });
});
