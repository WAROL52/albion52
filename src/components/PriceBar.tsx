import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { clearOverride, getAgeMs, getFeed, isFresh, setOverride } from '../data/prices';
import type { PriceFeed } from '../engine/calc';

const fmtAge = (ms: number): string => {
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}min`;
  return `${Math.floor(ms / 3_600_000)}h`;
};

export function PriceBar({ outId, onSynced }: { outId: string; onSynced: () => Promise<void> }) {
  const [feed, setFeed] = useState<PriceFeed>(getFeed);
  const [draft, setDraft] = useState('');
  const [overridden, setOverridden] = useState(false);

  const apply = async () => {
    await onSynced();
    setFeed(getFeed());
  };

  useEffect(() => {
    void apply();
  }, [outId]);

  const age = getAgeMs(outId);
  const overPrice = draft.trim() === '' ? NaN : Number(draft);

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[var(--muted)]">{t('prices.title')}</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[var(--muted)]">
            {age === null ? t('prices.noData') : isFresh(outId) ? t('prices.age', { age: fmtAge(age) }) : t('prices.stale', { age: fmtAge(age) })}
          </span>
          <button
            onClick={() => void apply()}
            className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[var(--accent)] hover:bg-[var(--panel2)]"
            title={t('prices.refresh')}
          >
            ↻
          </button>
        </span>
      </div>

      {feed[outId] && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--muted)]">{t('prices.sell')}</span>
          <span className="font-semibold tabular-nums text-[var(--silver)]">{feed[outId].bid[0].toLocaleString('fr-FR')}</span>
          <span className="text-[var(--muted)]">{t('prices.buy')}</span>
          <span className="font-semibold tabular-nums">{feed[outId].ask[0].toLocaleString('fr-FR')}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-[var(--muted)]">{t('prices.override')}</span>
        <input
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="—"
          className="w-24 rounded border border-[var(--line)] bg-[var(--panel2)] px-2 py-0.5 tabular-nums text-[var(--fg)] outline-none focus:border-[var(--accent)]"
        />
        {overridden && (
          <button
            onClick={() => {
              clearOverride(outId);
              setOverridden(false);
              setFeed(getFeed());
            }}
            className="text-[var(--neg)] hover:underline"
          >
            ✕
          </button>
        )}
        <button
          disabled={Number.isNaN(overPrice) || overPrice <= 0}
          onClick={() => {
            setOverride(outId, overPrice);
            setOverridden(true);
            setFeed(getFeed());
          }}
          className="rounded-full border border-[var(--accent)] px-2 py-0.5 text-[var(--accent)] disabled:opacity-40"
        >
          {t('prices.apply')}
        </button>
      </div>
    </div>
  );
}
