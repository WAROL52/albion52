import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('écran sélection + verdict (fumée d\'intégration)', () => {
  beforeEach(() => localStorage.clear());

  it('restaure les réglages persistés au rechargement', () => {
    localStorage.setItem('albion52:settings:v1', JSON.stringify({ quantity: 500, focus: true, sense: 'orders', selection: { family: 'MAIN_SWORD', tier: 'T5', enchant: 0, quality: 'ev' } }));
    render(<App />);
    expect((screen.getByLabelText('Quantité') as HTMLInputElement).value).toBe('500');
    expect(screen.getByRole('switch', { name: 'Utiliser le focus' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('T5_MAIN_SWORD')).toBeInTheDocument();
  });

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
    fireEvent.click(screen.getAllByRole('button', { name: /Lingot/ })[0]);
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

  it('ajuste la quantité par stepper et saisie, bornée à 10000', () => {
    render(<App />);
    const input = screen.getByLabelText('Quantité') as HTMLInputElement;
    expect(input.value).toBe('100');
    fireEvent.click(screen.getAllByRole('button', { name: '+' })[0]);
    expect(input.value).toBe('150');
    fireEvent.change(input, { target: { value: '99999' } });
    expect(input.value).toBe('10000');
    fireEvent.change(input, { target: { value: '0' } });
    expect(input.value).toBe('1');
  });

  it('bascule focus / sens / journal et règle frais + taxe en direct', () => {
    render(<App />);
    const read = () => screen.getByText(/Silver \/ heure/).parentElement!.textContent!;
    const before = read();

    fireEvent.click(screen.getByRole('switch', { name: 'Utiliser le focus' }));
    const afterFocus = read();
    expect(afterFocus).not.toBe(before);

    fireEvent.click(screen.getByRole('button', { name: 'Ordres' }));
    const afterSense = read();
    expect(afterSense).not.toBe(afterFocus);

    fireEvent.click(screen.getByRole('switch', { name: 'Journal compté' }));
    const afterJournal = read();
    expect(afterJournal).not.toBe(afterSense);

    fireEvent.click(screen.getAllByRole('button', { name: '−' })[1]);
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('ouvre la fiche item, navigue les onglets et se ferme', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Voir la fiche/ }));
    expect(screen.getByRole('button', { name: /Fermer/ })).toBeInTheDocument();
    expect(screen.getByText('Détails')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Exigences de fabrication/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Lingot/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Utilisé dans/ }));
    expect(screen.getAllByText(/utilisé comme ingrédient/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Fermer/ }));
    expect(screen.queryByRole('button', { name: /Fermer/ })).not.toBeInTheDocument();
  });

  it('affiche le popover prix au survol d\'une icône d\'item', () => {
    render(<App />);
    const icones = screen.getAllByRole('img', { name: 'MAIN_SWORD' });
    const icone = icones[icones.length - 1];
    expect(screen.queryByText('Qualité visée')).not.toBeInTheDocument();
    fireEvent.mouseEnter(icone.parentElement!);
    expect(screen.getAllByText('Qualité visée').length).toBeGreaterThan(0);
    fireEvent.mouseLeave(icone.parentElement!);
    expect(screen.queryByText('Qualité visée')).not.toBeInTheDocument();
  });
});
