import { useState } from 'react';
import { Calc, type PriceFeed, type Source, type State } from '../engine/calc';
import { t } from '../i18n';
import { famNameOf, kindOf, money } from '../lib/format';
import { Icon } from './Icon';
import { MARKETS, getAllPrices } from '../data/prices';

type Tab = 'details' | 'recipe' | 'used';

const SOURCE_LABEL: Record<Source, string> = {
  buy: t('detail.source.buy'),
  craft: t('detail.source.craft'),
  gather: t('detail.source.gather'),
};

const SOURCE_CLS: Record<Source, string> = {
  buy: 'border-[var(--line)] text-[var(--muted)]',
  craft: 'border-[var(--accent)] text-[var(--accent)]',
  gather: 'border-[var(--pos)] text-[var(--pos)]',
};

function itemFamOf(id: string): string {
  return Calc.parseId(id)?.family ?? id;
}

export function ItemPopup({ itemId, state, feed, onClose, onOpen }: {
  itemId: string;
  state: State;
  feed?: PriceFeed;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('details');
  const [qSel, setQSel] = useState<number>(typeof state.selection.quality === 'number' ? state.selection.quality : 1);
  const p = Calc.parseId(itemId);
  const fam = p ? Calc.FAMILIES[p.family] : undefined;
  const rec = Calc.recipeFor(itemId, state, Calc.sourceContext(state));
  const used = Calc.usedIn(itemId);
  const q = state.selection.quality;
  const sense = state.sense;
  const priceBuy = q === 'ev' ? Calc.evPrice(itemId, 'buy', state, feed) : Calc.qPrice(itemId, 'buy', q, sense, feed);
  const priceSell = q === 'ev' ? Calc.evPrice(itemId, 'sell', state, feed) : Calc.qPrice(itemId, 'sell', q, sense, feed);
  const marketPrices = getAllPrices(itemId);

  const tabs: Array<[Tab, string]> = [
    ['details', t('popup.tab.details')],
    ['recipe', t('popup.tab.recipe', { n: rec && rec.ingredients.length ? rec.ingredients.length + (rec.journal ? 1 : 0) : 0 })],
    ['used', t('popup.tab.used', { n: used.length })],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-t-2xl border border-[var(--line)] bg-[var(--panel)] shadow-2xl md:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--line)] p-4">
          <Icon fam={itemFamOf(itemId)} itemId={itemId} state={state} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold">{famNameOf(itemFamOf(itemId))}</div>
            <div className="truncate text-xs text-[var(--muted)]">{itemId}</div>
            <div className="mt-0.5 text-xs text-[var(--muted)]">
              {t('popup.buy')} {money(priceBuy)} · {t('popup.sell')} {money(priceSell)}
            </div>
          </div>
          <button onClick={onClose} aria-label={t('popup.close')} className="rounded-full px-2.5 py-1 text-xl leading-none text-[var(--muted)] hover:bg-[var(--panel2)]">
            ×
          </button>
        </div>

        <div className="flex gap-1 border-b border-[var(--line)] px-3 pt-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-t-lg px-3 py-2 text-xs font-bold ${tab === key ? 'border-b-2 border-[var(--accent)] text-[var(--fg)]' : 'text-[var(--muted)]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {tab === 'details' && (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--muted)]">{t('popup.type')}</span><span>{kindOf(itemFamOf(itemId))}</span></div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">{t('popup.tier')}</span>
                  <span>{p?.tier}{p?.enchant ? ` .${p.enchant}` : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">{t('popup.quality')}</span>
                  <span>{q === 'ev' ? t('popup.quality.ev') : `Q${q}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">{t('popup.buy')}</span>
                  <span>{money(priceBuy)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">{t('popup.sell')}</span>
                  <span>{money(priceSell)}</span>
                </div>
                {fam?.base !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">{t('popup.base')}</span>
                    <span>{money(fam.base)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t('popup.marketPrices')} · Q{qSel}</span>
                  <span className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setQSel(n)}
                        className={`rounded-full border px-1.5 py-px text-[9px] ${n === qSel ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[#1c1305]' : 'border-[var(--line)] text-[var(--muted)]'}`}
                      >
                        Q{n}
                      </button>
                    ))}
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-[var(--line)]">
                  {MARKETS.map(m => {
                    const mp = marketPrices[m];
                    const ask = mp.ask[qSel - 1];
                    const bid = mp.bid[qSel - 1];
                    return (
                      <div key={m} className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-2.5 py-1 last:border-b-0">
                        <span className={m === state.market ? 'font-semibold text-[var(--accent)]' : 'text-[var(--fg)]'}>{m}</span>
                        <span className="flex items-center gap-3 tabular-nums text-xs">
                          <span className="text-[var(--muted)]">{t('prices.sell')} <span className="font-semibold text-[var(--silver)]">{ask > 0 ? money(ask) : '—'}</span></span>
                          <span className="text-[var(--muted)]">{t('prices.buy')} <span className="font-semibold">{bid > 0 ? money(bid) : '—'}</span></span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{fam?.kind === 'raw' ? t('popup.note.raw') : fam?.kind === 'refined' ? t('popup.note.refined') : fam?.kind === 'craft' ? t('popup.note.craft') : t('popup.note.journal')}</p>
            </>
          )}

          {tab === 'recipe' && (
            rec && rec.ingredients.length ? (
              <>
                <div className="space-y-1.5">
                  {rec.ingredients.map(([ingId, qty], i) => (
                    <button
                      key={ingId}
                      onClick={() => onOpen(ingId)}
                      className="flex w-full items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2.5 py-1.5 text-left"
                    >
                      <Icon fam={itemFamOf(ingId)} itemId={ingId} state={state} onClick={() => onOpen(ingId)} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{famNameOf(itemFamOf(ingId))}</span>
                        <span className="block text-xs text-[var(--muted)]">{ingId} × {qty}</span>
                      </span>
                      {rec.ingSources?.[i] && (
                        <span className={`shrink-0 rounded-full border px-1.5 py-px text-[9px] uppercase ${SOURCE_CLS[rec.ingSources[i]]}`}>
                          {SOURCE_LABEL[rec.ingSources[i]]}
                        </span>
                      )}
                    </button>
                  ))}
                  {rec.journal && (
                    <button
                      onClick={() => onOpen(rec.journal)}
                      className="flex w-full items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2.5 py-1.5 text-left"
                    >
                      <Icon fam={itemFamOf(rec.journal)} itemId={rec.journal} state={state} onClick={() => onOpen(rec.journal)} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{famNameOf(itemFamOf(rec.journal))}</span>
                        <span className="block text-xs text-[var(--muted)]">{rec.journal} × 1</span>
                      </span>
                      <span className={`shrink-0 rounded-full border px-1.5 py-px text-[9px] uppercase ${SOURCE_CLS.buy}`}>
                        {SOURCE_LABEL.buy}
                      </span>
                    </button>
                  )}
                </div>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {t('popup.craftTime', { time: rec.timeSec })}{rec.journal ? ` · ${t('popup.journalNote')}` : ''}
                </p>
              </>
            ) : (
              <p className="text-xs text-[var(--muted)]">{t('popup.noRecipe')}</p>
            )
          )}

          {tab === 'used' && (
            used.length ? (
              <div className="space-y-1.5">
                {used.map(u => (
                  <button
                    key={u}
                    onClick={() => onOpen(u)}
                    className="flex w-full items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2.5 py-1.5 text-left"
                  >
                    <Icon fam={itemFamOf(u)} itemId={u} state={state} onClick={() => onOpen(u)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{famNameOf(itemFamOf(u))}</span>
                      <span className="block text-xs text-[var(--muted)]">{kindOf(itemFamOf(u))} · {t('popup.usedAs')}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">{t('popup.noUsed')}</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
