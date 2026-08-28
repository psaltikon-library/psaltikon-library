import { supabase } from './../lib/supabase';
import { isChantHidden } from './chantVisibility';

/**
 * The composer suggestion list is dynamic: it's simply every distinct composer
 * already saved on a chant. Typing a new name and saving a chant makes that name
 * available the next time someone uploads.
 */
export async function loadComposers(): Promise<string[]> {
  const { data, error } = await supabase.from('chants').select('composer, status');
  if (error || !data) return [];

  const unique = new Set<string>();
  (data as Array<{ composer: string | null; status: string | null }>).forEach((row) => {
    if (isChantHidden(row)) return;
    const value = typeof row.composer === 'string' ? row.composer.trim() : '';
    if (value) unique.add(value);
  });

  return Array.from(unique).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
}
