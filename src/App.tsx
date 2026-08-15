import { useReducer, useState } from 'react';
import { Calc, type Action, type Selection, type State } from './engine/calc';
import { t } from './i18n';
import { Browser, type Crumb } from './components/Browser';
import { Verdict } from './components/Verdict';
import { Icon } from './components/Icon';
import { cls } from './lib/format';

const makeState = (): State => ({ ...Calc.DEFAULTS, sources: { ...Calc.DEFAULTS.sources } });

const reducer = (s: State, a: Action): State => Calc.reduce(s, a);

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, makeState);
  const [path, setPath] = useState<Crumb[]>([]);

  const res = Calc.compute(state);
  const fam = Calc.FAMILIES[state.selection.family];
  const r = res.recipe;

  const sel = (v: Partial<Selection>) => dispatch({ type: 'SET_SELECTION', value: v });
  const reset = () => {
    setPath([]);
    dispatch({ type: 'RESET' });
  };

  return (
    <div className="mx-auto max-w-[460px] px-3.5 pb-10 pt-4 md:max-w-[1180px]">
      <div className="md:grid md:grid-cols-[370px_minmax(0,1fr)] md:gap-6">
        <div className="md:sticky md:top-0 md:self-start">
          <div className="space-y-3">
            <Browser
              selection={state.selection}
              path={path}
              onPush={c => setPath(p => [...p, c])}
              onTo={i => setPath(p => (i < 0 ? [] : p.slice(0, i + 1)))}
              onSelect={sel}
              onReset={reset}
            />
          </div>
        </div>

        <div>
          <div className="mb-3 mt-3 flex items-center gap-2.5 md:mt-0">
            <Icon fam={state.selection.family} />
            <div className="min-w-0 flex-1 truncate text-base font-bold">
              {fam.name} <span className="text-xs font-normal text-[var(--muted)]">· {res.isRaw ? 'Ressource' : r?.type}</span>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${cls(res.craftVsBuy) === 'pos' ? 'border-[var(--pos)] bg-[#0f2010] text-[var(--pos)]' : 'border-[var(--neg)] bg-[#221011] text-[var(--neg)]'}`}>
              {res.craftVsBuy >= 0 ? t('verdict.craftCheaper') : t('verdict.buyCheaper')}
            </span>
          </div>

          <div className="mb-3 rounded-lg border border-l-[3px] border-l-[var(--accent)] border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--muted)]">
            {res.isRaw ? fam.name : r?.desc}
          </div>

          <Verdict res={res} qty={state.quantity} />
        </div>
      </div>
    </div>
  );
}
