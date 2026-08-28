import { Chant } from '../types';

/**
 * A chant is public only when an admin has approved it. Anything else — pending
 * (the default on upload) or hidden — is withdrawn from the whole public site:
 * the library, the Services directory, phonetics, the home page, search,
 * booklets, saved items and its own detail page. Admins still see every chant in
 * the library so they can approve or restore them.
 *
 * The check lives here, in one place, rather than in each query — partly so the
 * rule has a single definition, and partly because a `status = 'approved'`
 * filter in PostgREST would also drop rows whose status is NULL, which we treat
 * as not-yet-approved on purpose but want handled consistently everywhere.
 */
export const PUBLIC_STATUS = 'approved';

export function isChantPublic(chant: Pick<Chant, 'status'> | null | undefined): boolean {
  const status = chant?.status;
  return typeof status === 'string' && status.trim().toLowerCase() === PUBLIC_STATUS;
}

export function excludePrivateChants(chants: Chant[]): Chant[] {
  return chants.filter(isChantPublic);
}

/** Admins keep seeing every chant so they have a way to approve / unhide. */
export function isAdminViewer(): boolean {
  try {
    return localStorage.getItem('psaltikon_admin_authed') === 'true';
  } catch {
    return false;
  }
}
