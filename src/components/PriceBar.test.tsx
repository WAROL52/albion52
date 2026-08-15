import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceBar } from './PriceBar';
import { refresh } from '../data/prices';

const row = (item_id: string, quality: number, sell: number, bid: number) => ({
  item_id, quality, sell_price_min: sell, sell_price_max: sell,
  buy_price_min: bid, buy_price_max: bid,
});

describe('PriceBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('affiche le badge sans données puis le prix après synchro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [row('T4_MAIN_SWORD', 1, 7000, 4500)],
    }));
    await refresh(['T4_MAIN_SWORD']);
    const { rerender } = render(<PriceBar outId="T4_MAIN_SWORD" onSynced={async () => {}} />);
    await screen.findByText('4 500');
    expect(screen.getByText('7 000')).toBeInTheDocument();
    rerender(<PriceBar outId="T4_MAIN_SWORD" onSynced={async () => {}} />);
  });

  it('badge frais après sync', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [row('T4_MAIN_SWORD', 1, 7000, 4500)],
    }));
    await refresh(['T4_MAIN_SWORD']);
    render(<PriceBar outId="T4_MAIN_SWORD" onSynced={async () => {}} />);
    expect(await screen.findByText(/il y a \d+s/)).toBeInTheDocument();
  });
});
