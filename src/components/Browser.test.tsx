import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calc, type PriceFeed } from '../engine/calc';
import { Browser, type Crumb } from './Browser';

const feed: PriceFeed = {
  T4_MAIN_SWORD: { ask: [7000, 0, 0, 0, 0], bid: [4500, 0, 0, 0, 0] },
};

const path: Crumb[] = [
  { id: 'weapons', name: 'Armes' },
  { id: 'melee', name: 'Mêlée' },
  { id: 'swords', name: 'Épées' },
];

const renderBrowser = (family: string) => {
  const selection = { ...Calc.DEFAULTS.selection, family };
  return render(
    <Browser
      selection={selection}
      state={{ ...Calc.DEFAULTS, selection }}
      feed={feed}
      path={path}
      onPush={() => {}}
      onTo={() => {}}
      onSelect={() => {}}
      onReset={() => {}}
      onOpen={() => {}}
    />,
  );
};

describe('Browser — prix sur l\'item sélectionné', () => {
  it('affiche le prix de l\'item sélectionné dans l\'en-tête et sur sa tuile', () => {
    renderBrowser('MAIN_SWORD');
    expect(screen.getAllByText(/^Vente 4 500 · Achat 7 000$/).length).toBe(2);
  });

  it('n\'affiche aucun prix quand l\'item n\'a pas de données', () => {
    renderBrowser('ARMOR_LEATHER_SET1');
    expect(screen.queryByText(/4 500/)).toBeNull();
    expect(screen.queryByText(/7 000/)).toBeNull();
  });
});