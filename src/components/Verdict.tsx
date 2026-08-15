import type { ComputeResult } from '../engine/calc';
import { t } from '../i18n';
import { cls, fmtTime, money, verdict } from '../lib/format';

export function Verdict({ res, qty }: { res: ComputeResult; qty: number }) {
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
    </>
  );
}
