import { Chant } from '../types';

// The user's own colour coding, one per tone (index 0 = Tone 1).
export const TONE_COLORS = [
  '#EE0000', // Tone 1
  '#0015FF', // Tone 2
  '#00B050', // Tone 3
  '#225E99', // Tone 4
  '#C00000', // Tone 5
  '#163E64', // Tone 6
  '#3B7E23', // Tone 7
  '#C04F15', // Tone 8
];

// Feasts that carry their own colour. Order matters: "Nativity of the
// Theotokos" mentions both, and is a Theotokos feast, so Theotokos is checked first.
const FEAST_COLORS: Array<{ test: RegExp; color: string }> = [
  { test: /theotokos/i, color: TONE_COLORS[3] }, // Theotokos: Tone 4
  { test: /nativity/i, color: TONE_COLORS[0] }, // Nativity: Tone 1
  { test: /pascha/i, color: TONE_COLORS[4] }, // Pascha: Tone 5
  { test: /\blent(en)?\b/i, color: '#7030A0' }, // Lent
];

// Traditional names for each tone, besides the plain "Tone N" / "Mode N" forms.
const TONE_ALIASES: Record<string, number> = {
  'first tone': 1,
  'second tone': 2,
  'third tone': 3,
  'fourth tone': 4,
  'plagal 1': 5,
  'plagal of the first': 5,
  'echos plagios 1': 5,
  'plagal 2': 6,
  'plagal of the second': 6,
  'echos plagios 2': 6,
  'grave tone': 7,
  varys: 7,
  'echos varys': 7,
  'plagal 4': 8,
  'plagal of the fourth': 8,
  'echos plagios 4': 8,
};

/** 1–8 for a recognisable tone ("Tone 5 (Friyos)" included), otherwise null. */
export function toneNumber(tone?: string | null): number | null {
  const value = (tone || '').trim().toLowerCase();
  const number = TONE_ALIASES[value] ?? Number(value.match(/\b(?:tone|echos|mode)\s*([1-8])\b/)?.[1]);
  return number >= 1 && number <= 8 ? number : null;
}

export function toneColor(tone?: string | null): string | null {
  const number = toneNumber(tone);
  return number ? TONE_COLORS[number - 1] : null;
}

export function feastColor(feast?: string | null): string | null {
  const value = (feast || '').trim();
  return FEAST_COLORS.find((entry) => entry.test.test(value))?.color ?? null;
}

/** Text colour for a chant's PDF: a feast with its own colour wins over the tone. */
export function chantColor(chant: Pick<Chant, 'tone' | 'feast'>): string | null {
  return feastColor(chant.feast) ?? toneColor(chant.tone);
}
