import { supabase } from '../lib/supabase';
import { Chant } from '../types';

export type AdminProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  admin: boolean;
  created_at: string;
};

export type AdminSuggestionRow = {
  id: string;
  submitted_by: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
};

export type AdminCountStat = {
  label: string;
  value: number;
  detail: string;
};

export type AdminRouteStat = {
  route: string;
  view_count: number;
  last_viewed_at: string | null;
};

export type AdminChantStat = {
  chant_id: string;
  view_count?: number;
  save_count?: number;
  last_viewed_at?: string | null;
  last_saved_at?: string | null;
  chant?: Chant | null;
};

export type AdminDashboardData = {
  stats: AdminCountStat[];
  pageTraffic: AdminRouteStat[];
  mostViewedChants: AdminChantStat[];
  mostSavedChants: AdminChantStat[];
  suggestions: AdminSuggestionRow[];
  users: AdminProfileRow[];
};

const toNumber = (value: number | null | undefined) => value || 0;

const fetchCount = async (table: string) => {
  const { count } = await supabase.from(table).select('id', { count: 'exact', head: true });
  return toNumber(count);
};

const fetchChantsByIds = async (ids: string[]) => {
  if (!ids.length) return new Map<string, Chant>();

  const { data } = await supabase
    .from('chants')
    .select('*')
    .in('id', ids);

  const chants = (data as Chant[] | null) || [];
  return new Map(chants.map((chant) => [chant.id, chant]));
};

export async function loadAdminDashboardData(): Promise<AdminDashboardData> {
  const [
    totalChants,
    totalSaved,
    totalPageViews,
    totalSuggestions,
    totalUsers,
    usersResponse,
    suggestionsResponse,
    pageTrafficResponse,
    viewedResponse,
    savedResponse,
  ] = await Promise.all([
    fetchCount('chants'),
    fetchCount('saved_chants'),
    fetchCount('page_views'),
    fetchCount('chant_suggestions'),
    fetchCount('profiles'),
    supabase
      .from('profiles')
      .select('id, username, first_name, last_name, admin, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('chant_suggestions')
      .select('id, submitted_by, title, message, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('page_view_stats')
      .select('*')
      .order('view_count', { ascending: false }),
    supabase
      .from('chant_view_stats')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(5),
    supabase
      .from('chant_save_stats')
      .select('*')
      .order('save_count', { ascending: false })
      .limit(5),
  ]);

  const viewedRows = (viewedResponse.data || []) as AdminChantStat[];
  const savedRows = (savedResponse.data || []) as AdminChantStat[];
  const chantIds = Array.from(
    new Set([
      ...viewedRows.map((row) => row.chant_id),
      ...savedRows.map((row) => row.chant_id),
    ])
  );
  const chantMap = await fetchChantsByIds(chantIds);

  const stats: AdminCountStat[] = [
    { label: 'Total Chants', value: totalChants, detail: 'Published library records' },
    { label: 'Total Saves', value: totalSaved, detail: 'Saved chant bookmarks' },
    { label: 'Traffic Events', value: totalPageViews, detail: 'Tracked page views' },
    { label: 'Suggestions', value: totalSuggestions, detail: 'User-submitted requests' },
    { label: 'Users', value: totalUsers, detail: 'Profiles in the system' },
  ];

  return {
    stats,
    pageTraffic: ((pageTrafficResponse.data || []) as AdminRouteStat[]).map((row) => ({
      ...row,
      route: row.route || 'unknown',
    })),
    mostViewedChants: viewedRows.map((row) => ({
      ...row,
      chant: chantMap.get(row.chant_id) || null,
    })),
    mostSavedChants: savedRows.map((row) => ({
      ...row,
      chant: chantMap.get(row.chant_id) || null,
    })),
    suggestions: (suggestionsResponse.data || []) as AdminSuggestionRow[],
    users: (usersResponse.data || []) as AdminProfileRow[],
  };
}

export async function setUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ admin: isAdmin })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message || 'Failed to update admin access.');
  }
}