import { supabase } from '../lib/supabase';
import { Page } from '../types';

export async function recordPageView(page: Page, chantId: string | null = null): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('page_views').insert({
      route: page,
      chant_id: chantId,
      user_id: user?.id || null,
    });
  } catch {
    // Best-effort analytics only.
  }
}

export async function recordChantView(chantId: string): Promise<void> {
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