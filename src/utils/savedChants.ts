import { supabase } from '../lib/supabase';
import { Chant } from '../types';

export async function saveChant(chantId: string): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to save chants.');
  }

  const { error } = await supabase
    .from('saved_chants')
    .insert({
      user_id: user.id,
      chant_id: chantId,
    });

  if (error) {
    throw new Error(error.message || 'Failed to save chant.');
  }
}

export async function unsaveChant(chantId: string): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to unsave chants.');
  }

  const { error } = await supabase
    .from('saved_chants')
    .delete()
    .eq('user_id', user.id)
    .eq('chant_id', chantId);

  if (error) {
    throw new Error(error.message || 'Failed to unsave chant.');
  }
}

export async function isChantSaved(chantId: string): Promise<boolean> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const { data, error } = await supabase
    .from('saved_chants')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('chant_id', chantId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return !!data;
}

export async function getSavedChants(): Promise<Chant[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('saved_chants')
    .select('chants(*)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (error) {
    return [];
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((item: any) => item.chants)
    .filter((chant: any) => chant !== null) as Chant[];
}

export async function getSavedChantIds(): Promise<string[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('saved_chants')
    .select('chant_id')
    .eq('user_id', user.id);

  if (error || !data || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((item: any) => item.chant_id)
    .filter((chantId: any) => typeof chantId === 'string');
}
