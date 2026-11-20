import { supabase } from '../lib/supabase';

export type TrafficDay = { day: string; views: number; visitors: number };

export type TrafficMetrics = {
  range: { days: number; from: string; tz: string };
  totals: {
    views: number;
    visitors: number;
    sessions: number;
    signed_in_views: number;
    /** When visitor/visit/device/referrer tracking began; earlier rows are views only. */
    tracked_since: string | null;
  };
  previous: { views: number; visitors: number; sessions: number } | null;
  daily: TrafficDay[];
  routes: { route: string; views: number }[];
  chants: { chant_id: string; title: string | null; views: number }[];
  referrers: { host: string; views: number }[];
  devices: { device: string; views: number }[];
  /** Ten most active signed-in members (admins excluded). "Visits" = days active. */
  members: { user_id: string; name: string; views: number; active_days: number; last_seen: string; banned: boolean }[];
};

/** `days: 0` means all time. */
export const TRAFFIC_RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 0, label: 'All time' },
] as const;

export async function loadTrafficMetrics(days: number): Promise<TrafficMetrics> {
  // Day boundaries follow the admin's own clock.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let { data, error } = await supabase.rpc('get_traffic_metrics', { p_days: days, p_tz: tz });

  // An exotic browser time-zone name the database doesn't know: use its default.
  if (error && /time zone/i.test(error.message)) {
    ({ data, error } = await supabase.rpc('get_traffic_metrics', { p_days: days }));
  }

  if (error) throw new Error(error.message || 'Failed to load traffic metrics.');
  return data as TrafficMetrics;
}
