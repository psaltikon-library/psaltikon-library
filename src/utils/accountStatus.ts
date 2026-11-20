import { supabase } from '../lib/supabase';

/**
 * A banned account can no longer sign in or refresh its session, but a session that
 * is already open keeps working until its token expires (it still cannot write
 * anything: the database refuses). Sign that session out as soon as the app loads.
 */
export async function signOutIfBanned(): Promise<boolean> {
  try {
    if (localStorage.getItem('psaltikon_user_authed') !== 'true') return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('banned_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.banned_at) return false;

    await supabase.auth.signOut();
    localStorage.removeItem('psaltikon_user_authed');
    localStorage.removeItem('psaltikon_admin_authed');
    return true;
  } catch {
    return false;
  }
}
