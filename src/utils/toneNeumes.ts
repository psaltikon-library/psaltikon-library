import tone1 from '../assets/neumes/tone-1.png';
import tone2 from '../assets/neumes/tone-2.png';
import tone3 from '../assets/neumes/tone-3.png';
import tone4 from '../assets/neumes/tone-4.png';
import tone5 from '../assets/neumes/tone-5.png';
import tone6 from '../assets/neumes/tone-6.png';
import tone7 from '../assets/neumes/tone-7.png';
import tone8 from '../assets/neumes/tone-8.png';

const NEUMES = [tone1, tone2, tone3, tone4, tone5, tone6, tone7, tone8];

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

/** The neume image for a chant's tone, or null when the tone isn't one of the eight. */
export function neumeForTone(tone?: string | null): string | null {
  const value = (tone || '').trim().toLowerCase();
  const number =
    TONE_ALIASES[value] ?? Number(value.match(/\b(?:tone|echos|mode)\s*([1-8])\b/)?.[1]);
  return NEUMES[number - 1] ?? null;
}
