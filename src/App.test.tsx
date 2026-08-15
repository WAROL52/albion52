import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('écran sélection + verdict (fumée d\'intégration)', () => {
  it('affiche le verdict par défaut pour l\'épée T4', () => {
    render(<App />);
    expect(screen.getAllByText('Épée longue').length).toBeGreaterThan(0);
    expect(screen.getByText('T4_MAIN_SWORD')).toBeInTheDocument();
    expect(screen.getByText(/Silver \/ heure/)).toBeInTheDocument();
    expect(screen.getByText('Coût')).toBeInTheDocument();
    expect(screen.getByText('Revenu')).toBeInTheDocument();
    expect(screen.getByText('Profit')).toBeInTheDocument();
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
});
