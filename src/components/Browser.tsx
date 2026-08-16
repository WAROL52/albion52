import { Calc, type CatalogItem, type PriceFeed, type Selection, type State, type Tier } from '../engine/calc';
import { t } from '../i18n';
import { fmt } from '../lib/format';
import { Icon } from './Icon';

export interface Crumb {
  id: string;
  name: string;
}

interface BrowserProps {
  selection: Selection;
  state: State;
  feed: PriceFeed;
  path: Crumb[];
  onPush: (crumb: Crumb) => void;
  onTo: (i: number) => void;
  onSelect: (sel: Partial<Selection>) => void;
  onReset: () => void;
  onOpen?: (id: string) => void;
}

function nodeAt(path: Crumb[]): CatalogItem {
  let n: CatalogItem = { subs: Calc.CATALOG };
  for (const c of path) n = n.subs!.find(x => x.id === c.id)!;
  return n;
}

const kindLabel = (fam: string): string => {
  const k = Calc.FAMILIES[fam]?.kind;
  if (k === 'raw') return t('browser.kind.raw');
  if (k === 'refined') return t('browser.kind.refined');
  return t('browser.kind.craft');
};

export function Browser({ selection, state, feed, path, onPush, onTo, onSelect, onReset, onOpen }: BrowserProps) {
  const node = nodeAt(path);
  const fam = Calc.FAMILIES[selection.family];
  const outId = Calc.itemId(selection.family, selection.tier, selection.enchant);
  const price = feed[outId];

  const tiles = node.subs
    ? node.subs.map(sub => (
        <button
          key={sub.id}
          onClick={() => onPush({ id: sub.id!, name: sub.name! })}
          className="flex w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel2)] px-3 py-2 text-left"
        >
          <Icon
          fam={sub.icon ?? (sub.items ? sub.items[0] : 'ORE')}
          itemId={sub.items ? Calc.itemId(sub.items[0], selection.tier, selection.enchant) : undefined}
          state={state}
/>
          <span className="flex-1 text-sm font-bold">{sub.name}</span>
          <span className="text-[var(--muted)]">›</span>
        </button>
      ))
    : node.items?.map(f => (
        <div
          key={f}
          className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left ${
            selection.family === f ? 'border-[var(--accent)] bg-[#2a2216]' : 'border-[var(--line)] bg-[var(--panel2)]'
          }`}
        >
          <Icon
            fam={f}
            itemId={Calc.itemId(f, selection.tier, selection.enchant)}
            state={state}
            onClick={onOpen ? () => onOpen(Calc.itemId(f, selection.tier, selection.enchant)) : undefined}
          />
          <button onClick={() => onSelect({ family: f })} className="flex-1 text-left">
            <span className="block text-sm font-bold">{Calc.FAMILIES[f].name}</span>
            <span className="block text-xs text-[var(--muted)]">{kindLabel(f)}</span>
            {selection.family === f && price && (
              <span className="mt-0.5 block text-xs tabular-nums text-[var(--silver)]">
                {t('prices.sell')} {fmt(price.bid[0])} · {t('prices.buy')} {fmt(price.ask[0])}
              </span>
            )}
          </button>
          {selection.family === f && <span className="text-[var(--accent)]">✓</span>}
        </div>
      )) ?? [];

  const chips = <T,>(
    label: string,
    options: T[],
    current: T,
    onPick: (o: T) => void,
    fmt: (o: T) => string,
  ) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 self-center text-xs uppercase tracking-wide text-[var(--muted)]">{label}</span>
      {options.map(o => (
        <button
          key={String(o)}
          onClick={() => onPick(o)}
          className={`rounded-full border px-3 py-1 text-xs ${
            o === current
              ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[#1c1305]'
              : 'border-[var(--line)] bg-[var(--panel2)] text-[var(--muted)]'
          }`}
        >
          {fmt(o)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">{t('browser.title')}</h3>
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--panel)] px-3 py-2">
        <Icon fam={selection.family} alt={outId} itemId={outId} state={state} onClick={onOpen ? () => onOpen(outId) : undefined} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{fam.name}</div>
          <div className="truncate text-xs text-[var(--muted)]">{outId}</div>
          {price && (
            <div className="truncate text-xs tabular-nums text-[var(--silver)]">
              {t('prices.sell')} {fmt(price.bid[0])} · {t('prices.buy')} {fmt(price.ask[0])}
            </div>
          )}
        </div>
        <button onClick={onReset} className="rounded-full border border-[var(--neg)] bg-[#221011] px-3 py-1 text-xs text-[var(--neg)]">
          {t('browser.reset')}
        </button>
        {onOpen && (
          <button
            onClick={() => onOpen(outId)}
            aria-label={t('browser.openDetails')}
            title={t('browser.openDetails')}
            className="rounded-full border border-[var(--line)] bg-[var(--panel2)] px-2.5 py-1 text-xs font-bold text-[var(--muted)] hover:text-[var(--fg)]"
          >
            ℹ
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onTo(-1)}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${path.length ? 'border-[var(--line)] text-[var(--muted)]' : 'border-[var(--accent)] text-[var(--accent)]'}`}
        >
          {t('browser.breadcrumb.all')}
        </button>
        {path.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span className="text-[var(--line)]">›</span>
            <button
              onClick={() => onTo(i)}
              className={`rounded-full border px-2.5 py-0.5 text-xs ${i === path.length - 1 ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            >
              {c.name}
            </button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2">{tiles}</div>

      <div className="mt-3 space-y-2">
        {chips<Tier>(t('browser.tier'), Calc.TIERS, selection.tier, o => onSelect({ tier: o }), o => String(o))}
        {chips<number>(t('browser.enchant'), Calc.ENCHANTS, selection.enchant, o => onSelect({ enchant: o }), o => (o === 0 ? '.0' : `.${o}`))}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 self-center text-xs uppercase tracking-wide text-[var(--muted)]">{t('browser.quality')}</span>
          <button
            onClick={() => onSelect({ quality: 'ev' })}
            className={`rounded-full border px-3 py-1 text-xs ${selection.quality === 'ev' ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[#1c1305]' : 'border-[var(--line)] bg-[var(--panel2)] text-[var(--muted)]'}`}
          >
            {t('browser.quality.ev')}
          </button>
          {([1, 2, 3, 4, 5] as const).map(q => (
            <button
              key={q}
              onClick={() => onSelect({ quality: q })}
              className={`rounded-full border px-3 py-1 text-xs ${selection.quality === q ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[#1c1305]' : 'border-[var(--line)] bg-[var(--panel2)] text-[var(--muted)]'}`}
            >
              {t('browser.quality.q', { q })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
