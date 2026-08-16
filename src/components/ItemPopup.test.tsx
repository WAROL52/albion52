import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Calc } from '../engine/calc';
import { money } from '../lib/format';
import { ItemPopup } from './ItemPopup';

const seed = () => {
  localStorage.setItem('albion52:prices:v2', JSON.stringify({
    T4_MAIN_SWORD: {
      Caerleon: { ask: [1000, 1400, 2000, 3000, 5000], bid: [950, 1330, 1900, 2850, 4750], fetchedAt: Date.now() },
    },
  }));
};

const q = (n: number) => money(n).replace(/\u202F/g, ' ');

describe('ItemPopup — prix par marché et par qualité', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });

  it('affiche Q1 par défaut puis bascule sur Q5', () => {
    render(<ItemPopup itemId="T4_MAIN_SWORD" state={Calc.DEFAULTS} onClose={() => {}} onOpen={() => {}} />);
    expect(screen.getByText(q(1000))).toBeInTheDocument();
    expect(screen.getByText(q(950))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Q5' }));
    expect(screen.getByText(q(5000))).toBeInTheDocument();
    expect(screen.getByText(q(4750))).toBeInTheDocument();
  });
});