import { Chant } from '../types';
import { isChantPublic } from './chantVisibility';

const norm = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// How much each shared tag says "these two chants belong together".
const TAG_WEIGHTS: Array<[keyof Chant, number]> = [
  ['feast', 3],
  ['part', 2],
  ['tone', 2],
  ['composer', 2],
  ['service', 1],
  ['language', 1],
];

// Two weak tags (e.g. just service + language) are not enough to call it similar.
const SIMILAR_THRESHOLD = 3;

function tagScore(a: Chant, b: Chant): number {
  return TAG_WEIGHTS.reduce((sum, [field, weight]) => {
    const value = norm(a[field]);
    return value && value === norm(b[field]) ? sum + weight : sum;
  }, 0);
}

const byScoreThenTitle = (a: { chant: Chant; score: number }, b: { chant: Chant; score: number }) =>
  b.score - a.score ||
  a.chant.title.localeCompare(b.chant.title, undefined, { numeric: true, sensitivity: 'base' });

/**
 * Up to `limit` public chants related to `chant`: a mix of chants with similar
 * tags (feast / part / tone / composer / service / language) and chants filed in
 * the same church book. The two lists are interleaved, so whichever one has
 * fewer matches simply yields its slots to the other; anything left over is
 * filled with the closest weak matches.
 */
export function relatedChants(chant: Chant, pool: Chant[], limit = 3): Chant[] {
  const book = norm(chant.book);
  const scored = pool
    .filter((candidate) => candidate.id !== chant.id && isChantPublic(candidate))
    .map((candidate) => ({ chant: candidate, score: tagScore(chant, candidate) }))
    .sort(byScoreThenTitle);

  const similar = scored.filter((entry) => entry.score >= SIMILAR_THRESHOLD);
  // Same-book chants that are not already strong tag matches, so the mix is real.
  const sameBook = scored.filter(
    (entry) => entry.score < SIMILAR_THRESHOLD && book && norm(entry.chant.book) === book
  );
  const weak = scored.filter((entry) => entry.score > 0);

  const picked: Chant[] = [];
  const add = (entry?: { chant: Chant }) => {
    if (entry && picked.length < limit && !picked.includes(entry.chant)) picked.push(entry.chant);
  };

  for (let i = 0; i < Math.max(similar.length, sameBook.length); i++) {
    add(similar[i]);
    add(sameBook[i]);
  }
  weak.forEach(add);

  return picked;
}
