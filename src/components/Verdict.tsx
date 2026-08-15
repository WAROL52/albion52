import type { ComputeResult, Source, State } from '../engine/calc';
import { t } from '../i18n';
import { cls, fmtTime, money, verdict } from '../lib/format';
import { IngredientTree } from './IngredientTree';

export function Verdict({ res, qty, state, onSource, onOpen }: {
  res: ComputeResult;
  qty: number;
  state: State;
  onSource: (family: string, source: Source) => void;
  onOpen?: (id: string) => void;
}) {
  const rows = [
    { label: t('detail.net'), value: res.rc.net, cls: '' },
    { label: t('detail.fee'), value: res.fee, cls: '' },
    { label: t('detail.journal'), value: res.journ, cls: '' },
    { label: t('detail.tax'), value: res.tax, cls: 'neg' },
  ];

  return (
    <>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{t('verdict.silverPerHour')}</div>
            <div className={`text-3xl font-extrabold tabular-nums leading-tight ${cls(res.perHour)}`}>{money(res.perHour)}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {t('verdict.total', { verdict: verdict(res.profit), profit: money(res.profit), qty })}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{t('verdict.perUnit')}</div>
            <div className={`text-lg font-bold tabular-nums ${cls(res.perUnitProfit)}`}>{money(res.perUnitProfit)}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">{t('verdict.duration')}</div>
            <div className="text-sm font-semibold text-[var(--time)]">⏱ {fmtTime(res.secTotal)}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel2)] p-3">
          <div className="text-xs text-[var(--muted)]">{t('tiles.cost')}</div>
          <div className="mt-1 text-sm font-bold tabular-nums">{money(res.cost)}</div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel2)] p-3">
          <div className="text-xs text-[var(--silver)]">{t('tiles.revenue')}</div>
          <div className="mt-1 text-sm font-bold tabular-nums text-[var(--silver)]">{money(res.revGross)}</div>
        </div>
        <div className={`rounded-xl border bg-[var(--panel2)] p-3 ${cls(res.profit) === 'pos' ? 'border-[var(--pos)]' : 'border-[var(--neg)]'}`}>
          <div className="text-xs text-[var(--muted)]">{t('tiles.profit')}</div>
          <div className={`mt-1 text-sm font-bold tabular-nums ${cls(res.profit)}`}>{money(res.profit)}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
        <div className="mb-2 text-sm font-bold">{t('detail.title')}</div>
        <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1">
          {rows.map(r => (
            <div key={r.label} className="flex justify-between text-xs">
              <span className="text-[var(--muted)]">{r.label}</span>
              <span className={`tabular-nums ${r.cls === 'neg' ? 'text-[var(--neg)]' : 'text-[var(--fg)]'}`}>{money(r.value)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-[var(--line)] pt-1 text-xs font-bold">
            <span>{t('tiles.cost')}</span>
            <span className="tabular-nums">{money(res.cost)}</span>
          </div>
        </div>

        <div className="mb-1 text-xs uppercase tracking-wide text-[var(--muted)]">{t('detail.ingredients')}</div>
        <IngredientTree res={res} state={state} journCost={res.journ} onSource={onSource} onOpen={onOpen} />
      </div>
    </>
  );
}
