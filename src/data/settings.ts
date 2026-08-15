import type { State } from '../engine/calc';
import { Calc } from '../engine/calc';

const SETTINGS_KEY = 'albion52:settings:v1';

const read = (): Partial<State> => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Partial<State>) : {};
  } catch {
    return {};
  }
};

export const loadSettings = (): State => {
  const saved = read();
  return {
    ...Calc.DEFAULTS,
    ...saved,
    selection: { ...Calc.DEFAULTS.selection, ...saved.selection },
    sources: { ...Calc.DEFAULTS.sources, ...saved.sources },
  };
};

export const saveSettings = (state: State) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
  } catch {
    /* quota / privé : silencieux */
  }
};

export const clearSettings = () => {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    /* silencieux */
  }
};
