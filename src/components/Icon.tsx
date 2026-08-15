import { useState } from 'react';
import { Calc, type State } from '../engine/calc';
import { t } from '../i18n';
import { iconUrl, famNameOf, kindOf, money } from '../lib/format';

export function Icon({ fam, alt, itemId, state, onClick }: {
  fam: string;
  alt?: string;
  itemId?: string;
  state?: State;
  onClick?: () => void;
}) {
  const [show, setShow] = useState(false);
  const id = itemId ?? alt;
  const hover = {
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false),
  };
  const img = (
    <img
      src={iconUrl(fam)}
      alt={alt ?? fam}
      loading="lazy"
      className="h-11 w-11 shrink-0 rounded object-contain transition duration-150 group-hover:scale-105 sm:h-9 sm:w-9"
    />
  );
  const pop = id && state && show ? <Popover id={id} state={state} /> : null;

  if (!onClick) {
    return (
      <span tabIndex={0} {...hover} className="group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-[var(--panel2)] sm:h-9 sm:w-9">
        {img}
        {pop}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      title={alt ?? fam}
      aria-label={alt ?? fam}
      {...hover}
      className="group relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent transition duration-150 hover:border-[var(--accent)] hover:bg-[var(--panel2)] active:scale-90 sm:h-9 sm:w-9"
    >
      {img}
      {pop}
    </button>
  );
}

function Popover({ id, state }: { id: string; state: State }) {
  const p = Calc.parseId(id);
  const fam = p?.family ?? id;
  const q = state.selection.quality;
  const sense = state.sense;
  const buy = q === 'ev' ? Calc.evPrice(id, 'buy', state) : Calc.qPrice(id, 'buy', q, sense);
  const sell = q === 'ev' ? Calc.evPrice(id, 'sell', state) : Calc.qPrice(id, 'sell', q, sense);
  const row = (k: string, v: string) => (
    <div className="flex justify-between gap-3 text-xs tabular-nums">
      <span className="text-[var(--muted)]">{k}</span>
      <span className="font-bold text-[var(--fg)]">{v}</span>
    </div>
  );
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-[min(280px,80vw)] -translate-x-1/2 rounded-[10px] border border-[var(--accent)] bg-[#000]/95 p-2.5 text-left shadow-[0_8px_24px_#000a]">
      <div className="text-[13px] font-bold leading-snug">{famNameOf(fam)}</div>
      <div className="mt-0.5 text-[11px] text-[var(--muted)]">{id}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-[var(--accent)]">
        {kindOf(fam)} · {p?.tier}{p?.enchant ? ` .${p.enchant}` : ''}
      </div>
      <div className="mt-1.5">{row(t('popup.quality'), q === 'ev' ? t('popup.quality.ev') : `Q${q}`)}</div>
      <div className="mt-1.5">{row(t('popup.buy'), money(buy))}</div>
      {row(t('popup.sell'), money(sell))}
    </div>
  );
}
