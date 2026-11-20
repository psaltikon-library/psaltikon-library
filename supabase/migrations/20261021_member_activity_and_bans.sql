-- 1. Account bans   2. "Most active members" in the traffic metrics.
--
-- BANS. An admin can ban a registered account. A ban does two things:
--   * auth.users.banned_until is set far in the future, so Supabase Auth refuses
--     sign-in and refuses to refresh the session (an already-open session dies when
--     its short-lived token expires, at most about an hour);
--   * profiles.banned_at is set, and RESTRICTIVE policies stop that account writing
--     anything (booklets, saves, suggestions, submissions, PDF uploads) straight
--     away, even while its old token still works.
-- Restrictive policies are ANDed with the existing permissive ones, so none of the
-- existing policies had to change.
--
-- A ban is per account. It cannot stop someone browsing while logged out, or
-- registering a new account with another email; the Vercel Firewall (IP block) is
-- the only lever for that.

alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists ban_reason text;

-- Same guard the table already uses for `admin`: only an admin may change ban fields,
-- so a banned user cannot un-ban themselves by updating their own profile.
create or replace function public.prevent_profile_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_current_user_admin() then
    if tg_op = 'INSERT' then
      new.admin := false;
      new.banned_at := null;
      new.ban_reason := null;
    elsif tg_op = 'UPDATE' then
      new.admin := coalesce(old.admin, false);
      new.banned_at := old.banned_at;
      new.ban_reason := old.ban_reason;
    end if;
  end if;

  return new;
end;
$$;

-- Evaluated inside RLS policies, so it must stay executable by every role (do NOT revoke).
create or replace function public.is_current_user_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select banned_at is not null from public.profiles where id = auth.uid()), false);
$$;

-- Banned accounts cannot create, change or delete anything in the tables users write to.
do $$
declare
  t text;
begin
  foreach t in array array[
    'booklets', 'booklet_chants', 'saved_chants', 'chant_suggestions',
    'chant_submissions', 'chants', 'chant_pdfs', 'profiles'
  ] loop
    execute format('drop policy if exists "Banned accounts cannot insert" on public.%I', t);
    execute format('drop policy if exists "Banned accounts cannot update" on public.%I', t);
    execute format('drop policy if exists "Banned accounts cannot delete" on public.%I', t);
    execute format('create policy "Banned accounts cannot insert" on public.%I as restrictive for insert with check (not public.is_current_user_banned())', t);
    execute format('create policy "Banned accounts cannot update" on public.%I as restrictive for update using (not public.is_current_user_banned()) with check (not public.is_current_user_banned())', t);
    execute format('create policy "Banned accounts cannot delete" on public.%I as restrictive for delete using (not public.is_current_user_banned())', t);
  end loop;
end
$$;

-- Submission PDF uploads live in storage.
drop policy if exists "Banned accounts cannot upload" on storage.objects;
drop policy if exists "Banned accounts cannot change files" on storage.objects;
drop policy if exists "Banned accounts cannot delete files" on storage.objects;
create policy "Banned accounts cannot upload" on storage.objects as restrictive for insert with check (not public.is_current_user_banned());
create policy "Banned accounts cannot change files" on storage.objects as restrictive for update using (not public.is_current_user_banned()) with check (not public.is_current_user_banned());
create policy "Banned accounts cannot delete files" on storage.objects as restrictive for delete using (not public.is_current_user_banned());

-- The only way the app bans or restores an account. Admin-only.
create or replace function public.admin_set_user_ban(p_user_id uuid, p_banned boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot ban your own account';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'No such user';
  end if;
  if p_banned and exists (select 1 from public.profiles where id = p_user_id and admin) then
    raise exception 'Revoke this account''s admin access before banning it';
  end if;

  update public.profiles
  set banned_at = case when p_banned then now() else null end,
      ban_reason = case when p_banned then nullif(trim(p_reason), '') else null end
  where id = p_user_id;

  -- A real date, not 'infinity': Supabase Auth reads this column and a Go time cannot hold infinity.
  update auth.users
  set banned_until = case when p_banned then now() + interval '100 years' else null end
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_set_user_ban(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_user_ban(uuid, boolean, text) to authenticated;

-- Traffic metrics, now with the ten most active signed-in members (admins excluded).
-- "Visits" for members = distinct days active, so it works on all history, which has no visit ids.
create or replace function public._traffic_metrics(p_days int, p_tz text)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_days int := greatest(coalesce(p_days, 30), 0);
  v_from timestamptz;
  v_prev_from timestamptz;
  v_result jsonb;
begin
  if not exists (select 1 from pg_timezone_names where name = p_tz) then
    raise exception 'Unknown time zone: %', p_tz;
  end if;

  if v_days = 0 then
    v_from := coalesce((select min(viewed_at) from public.page_views), now());
    v_prev_from := null;
  else
    v_from := (date_trunc('day', now() at time zone p_tz) - make_interval(days => v_days - 1)) at time zone p_tz;
    v_prev_from := v_from - make_interval(days => v_days);
  end if;

  with cur as (
    select * from public.page_views where viewed_at >= v_from
  ),
  prev as (
    select * from public.page_views
    where v_prev_from is not null and viewed_at >= v_prev_from and viewed_at < v_from
  ),
  day_series as (
    select d::date as day
    from generate_series((v_from at time zone p_tz)::date, (now() at time zone p_tz)::date, interval '1 day') d
  ),
  daily as (
    select (viewed_at at time zone p_tz)::date as day,
           count(*) as views,
           count(distinct visitor_id) as visitors
    from cur group by 1
  )
  select jsonb_build_object(
    'range', jsonb_build_object('days', v_days, 'from', v_from, 'tz', p_tz),
    'totals', jsonb_build_object(
      'views', (select count(*) from cur),
      'visitors', (select count(distinct visitor_id) from cur),
      'sessions', (select count(distinct session_id) from cur),
      'signed_in_views', (select count(*) from cur where user_id is not null),
      'tracked_since', (select min(viewed_at) from public.page_views where visitor_id is not null)
    ),
    'previous', case when v_prev_from is null then null else jsonb_build_object(
      'views', (select count(*) from prev),
      'visitors', (select count(distinct visitor_id) from prev),
      'sessions', (select count(distinct session_id) from prev)
    ) end,
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', s.day, 'views', coalesce(d.views, 0), 'visitors', coalesce(d.visitors, 0)
      ) order by s.day)
      from day_series s left join daily d using (day)
    ), '[]'::jsonb),
    'routes', coalesce((
      select jsonb_agg(jsonb_build_object('route', route, 'views', n) order by n desc)
      from (select route, count(*) n from cur group by route order by n desc limit 12) r
    ), '[]'::jsonb),
    'chants', coalesce((
      select jsonb_agg(jsonb_build_object('chant_id', chant_id, 'title', title, 'views', n) order by n desc)
      from (
        select c.chant_id, ch.title, count(*) n
        from cur c left join public.chants ch on ch.id = c.chant_id
        where c.chant_id is not null
        group by c.chant_id, ch.title order by n desc limit 10
      ) t
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('host', referrer_host, 'views', n) order by n desc)
      from (select referrer_host, count(*) n from cur where referrer_host is not null
            group by referrer_host order by n desc limit 10) r
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', device, 'views', n) order by n desc)
      from (select device, count(*) n from cur where device is not null group by device) r
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', user_id, 'name', name, 'views', views,
        'active_days', active_days, 'last_seen', last_seen, 'banned', banned
      ) order by views desc, last_seen desc)
      from (
        select c.user_id,
               coalesce(
                 nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
                 nullif(p.username, ''),
                 'Member ' || left(c.user_id::text, 8)
               ) as name,
               count(*) as views,
               count(distinct (c.viewed_at at time zone p_tz)::date) as active_days,
               max(c.viewed_at) as last_seen,
               (p.banned_at is not null) as banned
        from cur c
        left join public.profiles p on p.id = c.user_id
        where c.user_id is not null and coalesce(p.admin, false) = false
        group by c.user_id, p.first_name, p.last_name, p.username, p.banned_at
        order by count(*) desc, max(c.viewed_at) desc
        limit 10
      ) m
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public._traffic_metrics(int, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
