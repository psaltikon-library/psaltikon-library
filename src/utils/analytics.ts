import { supabase } from '../lib/supabase';
import { Page } from '../types';

const VISITOR_KEY = 'psaltikon_visitor_id';
const SESSION_KEY = 'psaltikon_session_id';
const ENTRY_KEY = 'psaltikon_session_entry';
export const DEV_TRACKING_KEY = 'psaltikon_track_dev';

/**
 * Skip traffic that would only distort the numbers: local development (which
 * writes to the live database), the site owner while logged in as admin, and
 * crawlers / headless browsers.
 */
export function shouldTrack(): boolean {
  try {
    if (import.meta.env.DEV && localStorage.getItem(DEV_TRACKING_KEY) !== '1') return false;
    if (localStorage.getItem('psaltikon_admin_authed') === 'true') return false;
  } catch {
    // Storage blocked: carry on and count the view.
  }
  return !/bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent);
}

const privacyOptOut = () =>
  navigator.doNotTrack === '1' ||
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

function storedId(store: Storage, key: string): string | null {
  try {
    let id = store.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      store.setItem(key, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Only the first view of a visit carries a referrer, so each visit counts once. */
function entryReferrer(): string | null {
  try {
    if (sessionStorage.getItem(ENTRY_KEY)) return null;
    sessionStorage.setItem(ENTRY_KEY, '1');
  } catch {
    return null;
  }

  try {
    const strip = (host: string) => host.replace(/^www\./, '');
    const host = document.referrer ? strip(new URL(document.referrer).hostname) : '';
    if (host && host !== strip(location.hostname)) return host.slice(0, 255);
  } catch {
    // Malformed referrer: treat as direct.
  }
  return '(direct)';
}

const deviceClass = (): 'mobile' | 'tablet' | 'desktop' =>
  window.matchMedia('(max-width: 767px)').matches
    ? 'mobile'
    : window.matchMedia('(max-width: 1024px)').matches
      ? 'tablet'
      : 'desktop';

/**
 * The anonymous, first-party fields stored with each page view. Nothing here is
 * an IP address, a user-agent string or a fingerprint: the ids are random values
 * the browser makes for itself. A visitor who sends Do Not Track / Global Privacy
 * Control still counts as a page view, but gets no ids and no referrer.
 */
export function trafficFields() {
  const device = deviceClass();
  if (privacyOptOut()) return { device, visitor_id: null, session_id: null, referrer_host: null };

  return {
    device,
    visitor_id: storedId(localStorage, VISITOR_KEY),
    session_id: storedId(sessionStorage, SESSION_KEY),
    referrer_host: entryReferrer(),
  };
}

export async function recordPageView(page: Page, chantId: string | null = null): Promise<void> {
  if (!shouldTrack()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('page_views').insert({
      route: page,
      chant_id: chantId,
      user_id: user?.id || null,
      ...trafficFields(),
    });
  } catch {
    // Best-effort analytics only.
  }
}

export async function recordChantView(chantId: string): Promise<void> {
  if (!shouldTrack()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('chant_views').insert({
      chant_id: chantId,
      user_id: user?.id || null,
    });
  } catch {
    // Best-effort analytics only.
  }
}
