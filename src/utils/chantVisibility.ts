import { Chant } from '../types';

/**
 * A chant an admin marks "hidden" is withdrawn from the whole public site — the
 * library, the Services directory, phonetics, the home page, search, booklets,
 * saved items and its own detail page. Admins still see hidden chants in the
 * library so they can restore them.
 *
 * Filtering happens here rather than in each query so the rule has one
 * definition, and because a `status <> 'hidden'` filter in PostgREST would also
 * drop rows whose status is NULL. Only an explicit "hidden" hides a chant.
 */
export const HIDDEN_STATUS = 'hidden';

export function isChantHidden(chant: Pick<Chant, 'status'> | null | undefined): boolean {
  const status = chant?.status;
  return typeof status === 'string' && status.trim().toLowerCase() === HIDDEN_STATUS;
}

export function excludeHiddenChants(chants: Chant[]): Chant[] {
  return chants.filter((chant) => !isChantHidden(chant));
}

/** Admins keep seeing hidden chants so they have a way to unhide them. */
export function isAdminViewer(): boolean {
  try {
    return localStorage.getItem('psaltikon_admin_authed') === 'true';
  } catch {
    return false;
  }
}
