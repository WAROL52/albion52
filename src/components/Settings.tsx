import type { Action, State } from '../engine/calc';
import { t } from '../i18n';

export function Settings({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const act = (a: Action) => dispatch(a);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3.5">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{t('settings.title')}</div>

      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm">{t('settings.quantity')}</span>
        <span className="stepper flex items-center gap-1">
          <button
            onClick={() => act({ type: 'SET_QTY', value: state.quantity - 50 })}
            className="h-6 w-6 rounded-md border border-[var(--line)] bg-[var(--panel2)] text-sm leading-none"
          >
            −
          </button>
          <input
            inputMode="numeric"
            aria-label={t('settings.quantity')}
            className="qty h-7 w-14 rounded-md border border-[var(--line)] bg-[var(--panel2)] text-center text-sm font-bold"
            value={state.quantity}
            onChange={e => act({ type: 'SET_QTY', value: Number(e.target.value) })}
          />
          <button
            onClick={() => act({ type: 'SET_QTY', value: state.quantity + 50 })}
            className="h-6 w-6 rounded-md border border-[var(--line)] bg-[var(--panel2)] text-sm leading-none"
          >
            +
          </button>
        </span>
      </div>

      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm">{t('settings.focus')}</span>
        <button
          role="switch"
          aria-checked={state.focus}
          aria-label={t('settings.focus')}
          onClick={() => act({ type: 'TOGGLE_FOCUS' })}
          className={`relative h-5 w-9 rounded-full transition ${state.focus ? 'bg-[var(--accent)]' : 'bg-[var(--line)]'}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#1c1305] transition-all ${state.focus ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm">{t('settings.sense')}</span>
        <span className="seg flex overflow-hidden rounded-lg border border-[var(--line)]">
          <button
            onClick={() => state.sense !== 'instant' && act({ type: 'TOGGLE_SENSE' })}
            className={`px-2.5 py-0.5 text-xs ${state.sense === 'instant' ? 'bg-[var(--accent)] font-bold text-[#1c1305]' : 'bg-[var(--panel2)] text-[var(--muted)]'}`}
          >
            {t('settings.instant')}
          </button>
          <button
            onClick={() => state.sense !== 'orders' && act({ type: 'TOGGLE_SENSE' })}
            className={`px-2.5 py-0.5 text-xs ${state.sense === 'orders' ? 'bg-[var(--accent)] font-bold text-[#1c1305]' : 'bg-[var(--panel2)] text-[var(--muted)]'}`}
          >
            {t('settings.orders')}
          </button>
        </span>
      </div>

      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm">{t('settings.stationFee')}</span>
        <span className="flex items-center gap-1">
          <button
            onClick={() => act({ type: 'SET_STATION_FEE', value: state.stationFeePct - 5 })}
            className="h-6 w-6 rounded-md border border-[var(--line)] bg-[var(--panel2)] text-sm leading-none"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-bold tabular-nums">{state.stationFeePct}%</span>
          <button
            onClick={() => act({ type: 'SET_STATION_FEE', value: state.stationFeePct + 5 })}
            className="h-6 w-6 rounded-md border border-[var(--line)] bg-[var(--panel2)] text-sm leading-none"
          >
            +
          </button>
        </span>
      </div>

      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm">{t('settings.marketTax')}</span>
        <span className="flex items-center gap-1">
          <button
            onClick={() => act({ type: 'SET_TAX', value: state.marketTaxPct - 1 })}
            className="h-6 w-6 rounded-md border border-[var(--line)] bg-[var(--panel2)] text-sm leading-none"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-bold tabular-nums">{state.marketTaxPct}%</span>
          <button
            onClick={() => act({ type: 'SET_TAX', value: state.marketTaxPct + 1 })}
            className="h-6 w-6 rounded-md border border-[var(--line)] bg-[var(--panel2)] text-sm leading-none"
          >
            +
          </button>
        </span>
      </div>

      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm">{t('settings.journal')}</span>
        <button
          role="switch"
          aria-checked={state.journalCounted}
          aria-label={t('settings.journal')}
          onClick={() => act({ type: 'TOGGLE_JOURNAL' })}
          className={`relative h-5 w-9 rounded-full transition ${state.journalCounted ? 'bg-[var(--accent)]' : 'bg-[var(--line)]'}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#1c1305] transition-all ${state.journalCounted ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </div>
    </div>
  );
}
