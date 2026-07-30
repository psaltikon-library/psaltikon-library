import { supabase } from '../lib/supabase';
import { Booklet, Chant } from '../types';
import { DEV_CHANTS } from '../data/devChants';

export interface BookletInput {
  title: string;
  description?: string;
  isPublic: boolean;
  chantIds: string[];
}

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Best-effort display name for booklet attribution, snapshotted at save time. */
export async function resolveAuthorName(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) return 'Anonymous';

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, first_name, last_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.username) return profile.username;
  if (profile?.first_name) {
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  }

  const meta = (user.user_metadata || {}) as Record<string, string>;
  return meta.username || meta.first_name || (user.email ? user.email.split('@')[0] : 'Anonymous');
}

function mapChantCount(row: any): Booklet {
  const nested = row.booklet_chants;
  const chantCount = Array.isArray(nested) ? Number(nested[0]?.count ?? 0) : 0;
  const { booklet_chants, ...rest } = row;
  return { ...(rest as Booklet), chantCount };
}

// ── Dev fallback (shown in preview when the booklets tables don't exist yet) ──
const DEV_TS = '2026-06-20T10:00:00.000Z';

function devPopularBooklets(): Booklet[] {
  return [
    {
      id: 'dev-booklet-nativity',
      user_id: 'dev-user-1',
      title: 'Nativity Vigil Essentials',
      description: 'Core hymns for the Vigil of the Nativity of Christ.',
      author_name: 'Fr. Seraphim',
      is_public: true,
      download_count: 214,
      created_at: DEV_TS,
      updated_at: DEV_TS,
      chantCount: DEV_CHANTS.length,
      chants: DEV_CHANTS,
    },
    {
      id: 'dev-booklet-pascha',
      user_id: 'dev-user-2',
      title: 'Paschal Matins',
      description: 'The joyful canon and stichera of Pascha, arranged for the choir.',
      author_name: 'Choir of St. Romanos',
      is_public: true,
      download_count: 176,
      created_at: DEV_TS,
      updated_at: DEV_TS,
      chantCount: DEV_CHANTS.length,
      chants: DEV_CHANTS,
    },
    {
      id: 'dev-booklet-sunday',
      user_id: 'dev-user-3',
      title: 'Sunday Divine Liturgy',
      description: 'A complete order of common Sunday Liturgy hymns across the tones.',
      author_name: 'Anastasia K.',
      is_public: true,
      download_count: 98,
      created_at: DEV_TS,
      updated_at: DEV_TS,
      chantCount: DEV_CHANTS.length,
      chants: DEV_CHANTS,
    },
  ];
}

export async function listMyBooklets(): Promise<Booklet[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('booklets')
    .select('*, booklet_chants(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return (data as any[]).map(mapChantCount);
}

export async function listPopularBooklets(limit = 8): Promise<Booklet[]> {
  const user = await getCurrentUser();

  let query = supabase
    .from('booklets')
    .select('*, booklet_chants(count)')
    .eq('is_public', true)
    .order('download_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (user) query = query.neq('user_id', user.id);

  const { data, error } = await query;

  if (error) {
    return import.meta.env.DEV ? devPopularBooklets().slice(0, limit) : [];
  }
  if (!data || data.length === 0) {
    return import.meta.env.DEV ? devPopularBooklets().slice(0, limit) : [];
  }
  return (data as any[]).map(mapChantCount);
}

/** Load a booklet together with its chants, ordered by position. */
export async function getBookletWithChants(id: string): Promise<Booklet | null> {
  if (id.startsWith('dev-booklet-')) {
    return devPopularBooklets().find((b) => b.id === id) ?? null;
  }

  const { data: booklet, error } = await supabase
    .from('booklets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !booklet) return null;

  const { data: rows } = await supabase
    .from('booklet_chants')
    .select('position, chants(*)')
    .eq('booklet_id', id)
    .order('position', { ascending: true });

  const chants = (rows || [])
    .map((row: any) => row.chants)
    .filter((c: any): c is Chant => c !== null);

  return { ...(booklet as Booklet), chants, chantCount: chants.length };
}

async function replaceBookletChants(bookletId: string, chantIds: string[]) {
  await supabase.from('booklet_chants').delete().eq('booklet_id', bookletId);

  if (chantIds.length === 0) return;

  const rows = chantIds.map((chantId, index) => ({
    booklet_id: bookletId,
    chant_id: chantId,
    position: index,
  }));

  const { error } = await supabase.from('booklet_chants').insert(rows);
  if (error) throw new Error(error.message || 'Failed to save booklet chants.');
}

export async function createBooklet(input: BookletInput): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('You must be logged in to create a booklet.');

  const authorName = await resolveAuthorName();

  const { data, error } = await supabase
    .from('booklets')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      author_name: authorName,
      is_public: input.isPublic,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create booklet.');

  await replaceBookletChants(data.id, input.chantIds);
  return data.id;
}

export async function updateBooklet(id: string, input: BookletInput): Promise<void> {
  const { error } = await supabase
    .from('booklets')
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      is_public: input.isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update booklet.');

  await replaceBookletChants(id, input.chantIds);
}

export async function setBookletVisibility(id: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('booklets')
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update visibility.');
}

export async function deleteBooklet(id: string): Promise<void> {
  const { error } = await supabase.from('booklets').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete booklet.');
}

export async function addChantToBooklet(bookletId: string, chantId: string): Promise<void> {
  // Place the new chant after the current last position.
  const { data: existing } = await supabase
    .from('booklet_chants')
    .select('position')
    .eq('booklet_id', bookletId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? Number(existing[0].position) + 1 : 0;

  const { error } = await supabase
    .from('booklet_chants')
    .upsert(
      { booklet_id: bookletId, chant_id: chantId, position: nextPosition },
      { onConflict: 'booklet_id,chant_id', ignoreDuplicates: true }
    );

  if (error) throw new Error(error.message || 'Failed to add chant to booklet.');
}

/** Bump a public booklet's download counter (best-effort; ignores failures). */
export async function recordBookletDownload(id: string): Promise<void> {
  if (id.startsWith('dev-booklet-')) return;
  try {
    await supabase.rpc('increment_booklet_downloads', { p_booklet_id: id });
  } catch {
    /* non-critical */
  }
}
