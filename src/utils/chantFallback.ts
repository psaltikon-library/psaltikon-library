import { Chant } from '../types';
import { DEV_CHANTS } from '../data/devChants';

export function resolveChantsWithDevFallback(chants: Chant[] | null | undefined): Chant[] {
  if (Array.isArray(chants) && chants.length > 0) {
    return chants;
  }

  return import.meta.env.DEV ? DEV_CHANTS : [];
}

export function resolveChantWithDevFallback(
  chants: Chant[] | null | undefined,
  chantId: string | null | undefined
): Chant | null {
  if (Array.isArray(chants)) {
    const matchedChant = chants.find((chant) => chant.id === chantId);
    if (matchedChant) {
      return matchedChant;
    }
  }

  if (!import.meta.env.DEV || !chantId) {
    return null;
  }

  return DEV_CHANTS.find((chant) => chant.id === chantId) || null;
}