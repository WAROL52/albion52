import { fr } from './fr';

export type Locale = 'fr';
export type MessageKey = keyof typeof fr;

const messages: Record<Locale, typeof fr> = { fr };

export const t = (key: MessageKey): string => messages.fr[key];

export const locale: Locale = 'fr';
