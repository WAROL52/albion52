import { Calc, type IngredientNode, type State, type Source } from '../engine/calc';
import { t } from '../i18n';
import { Icon } from './Icon';
import { money } from '../lib/format';

const SOURCE_LABEL: Record<Source, string> = {
  buy: t('detail.source.buy'),
  craft: t('detail.source.craft'),
  gather: t('detail.source.gather'),
};

const famName = (id: string): string => {
  const fam = Calc.parseId(id)?.family ?? id;
  if (fam.indexOf('JOURNAL_') === 0) {
    const prof = fam.slice('JOURNAL_'.length);
    return Calc.JOURNAL[prof] ? Calc.JOURNAL[prof].name : fam;
  }
  return Calc.FAMILIES[fam] ? Calc.FAMILIES[fam].name : fam;
};

const sourceOf = (s: State, fam: string): Source => s.sources[fam] || Calc.defaultSources()[fam];

function SourceButtons({ id, state, onSource }: { id: string; state: State; onSource: (family: string, source: Source) => void }) {
  const fam = Calc.parseId(id)?.family ?? id;
  const cur = sourceOf(state, fam);
  return (
    <span className="ml-2 inline-flex gap-1">
      {Calc.sourceOptions(id).map(o => (
        <button
          key={o}
          onClick={() => onSource(fam, o)}
          className={`rounded-full border px-2 py-0.5 text-[10px] ${
            cur === o
              ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[#1c1305]'
              : 'border-[var(--line)] bg-[var(--panel2)] text-[var(--muted)]'
          }`}
        >
          {SOURCE_LABEL[o]}
        </button>
      ))}
    </span>
  );
}

function IngRow({ node, state, depth, onSource }: {
  node: IngredientNode;
  state: State;
  depth: number;
  onSource: (family: string, source: Source) => void;
}) {
  const children = node.children && node.children.length > 0 ? node.children : [];
  return (
    <div className="py-1" style={{ marginLeft: depth * 18 }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center">
          <Icon fam={Calc.parseId(node.item)?.family ?? node.item} />
          <span className="ml-1.5 truncate text-sm">
            <span className="font-semibold">{famName(node.item)}</span>
            <span className="text-[var(--muted)]"> × {node.qty}</span>
            {node.sub && (
              <span className="ml-1 text-[10px] uppercase text-[var(--muted)]">↳ {node.sub.name}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SourceButtons id={node.item} state={state} onSource={onSource} />
          <span className="text-sm font-semibold tabular-nums text-[var(--silver)]">{money(node.cost)}</span>
        </div>
      </div>
      {children.map(c => (
        <IngRow key={c.item} node={c} state={state} depth={depth + 1} onSource={onSource} />
      ))}
    </div>
  );
}

export function IngredientTree({ res, state, journCost, onSource }: {
  res: { isRaw: boolean; recipe: { journal: string; ingredients: Array<[string, number]> } | null; node: { ingNodes: IngredientNode[] } };
  state: State;
  journCost: number;
  onSource: (family: string, source: Source) => void;
}) {
  if (res.isRaw || !res.recipe) {
    return <div className="text-xs text-[var(--muted)]">{t('detail.rawHint')}</div>;
  }
  const journNode: IngredientNode | null = res.recipe.journal
    ? { item: res.recipe.journal, source: 'buy', qty: state.quantity, cost: journCost, timeSec: 0, children: [] }
    : null;
  return (
    <div>
      {res.node.ingNodes.map(n => (
        <IngRow key={n.item} node={n} state={state} depth={0} onSource={onSource} />
      ))}
      {journNode && state.journalCounted && (
        <IngRow key={journNode.item} node={journNode} state={state} depth={0} onSource={onSource} />
      )}
    </div>
  );
}
