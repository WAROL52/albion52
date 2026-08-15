import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('écran sélection + verdict (fumée d\'intégration)', () => {
  it('affiche le verdict par défaut pour l\'épée T4', () => {
    render(<App />);
    expect(screen.getAllByText('Épée longue').length).toBeGreaterThan(0);
    expect(screen.getByText('T4_MAIN_SWORD')).toBeInTheDocument();
    expect(screen.getByText(/Silver \/ heure/)).toBeInTheDocument();
    expect(screen.getAllByText('Coût').length).toBeGreaterThan(0);
    expect(screen.getByText('Revenu')).toBeInTheDocument();
    expect(screen.getAllByText('Profit').length).toBeGreaterThan(0);
  });

  it('navigue dans le catalogue et change le verdict sans rechargement', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Ressources/ }));
    fireEvent.click(screen.getByRole('button', { name: /Raffinées/ }));
    fireEvent.click(screen.getByRole('button', { name: /Lingot/ }));
    expect(screen.getByText('T4_METALBAR')).toBeInTheDocument();
    expect(screen.getByText(/Rentable|Pas rentable/)).toBeInTheDocument();
  });

  it('change le tier et met à jour l\'affichage', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'T5' }));
    expect(screen.getByText('T5_MAIN_SWORD')).toBeInTheDocument();
  });

  it('change la source d\'un ingrédient et recalcule le verdict en direct', () => {
    render(<App />);
    const read = () => screen.getByText(/Silver \/ heure/).parentElement!.textContent!;
    const before = read();
    expect(screen.getAllByRole('button', { name: 'Acheter' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Acheter' })[0]);
    const after = read();
    expect(after).not.toBe(before);
  });
});
