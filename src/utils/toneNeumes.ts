import tone1 from '../assets/neumes/tone-1.png';
import tone2 from '../assets/neumes/tone-2.png';
import tone3 from '../assets/neumes/tone-3.png';
import tone4 from '../assets/neumes/tone-4.png';
import tone5 from '../assets/neumes/tone-5.png';
import tone6 from '../assets/neumes/tone-6.png';
import tone7 from '../assets/neumes/tone-7.png';
import tone8 from '../assets/neumes/tone-8.png';
import { toneNumber } from './tones';

const NEUMES = [tone1, tone2, tone3, tone4, tone5, tone6, tone7, tone8];

/** The neume image for a chant's tone (used as a mask, so its own colour is irrelevant), or null. */
export function neumeForTone(tone?: string | null): string | null {
  const number = toneNumber(tone);
  return number ? NEUMES[number - 1] : null;
}
