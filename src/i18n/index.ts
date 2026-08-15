import { fr } from './fr';

export type Locale = 'fr';
export type MessageKey = keyof typeof fr;

const messages: Record<Locale, typeof fr> = { fr };

export const t = (key: MessageKey, params?: Record<string, string | number>): string => {
  let s: string = messages.fr[key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
};

export const locale: Locale = 'fr';
