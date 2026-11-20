-- Web-traffic metrics for the admin dashboard.
--
-- 1. page_views gains anonymous, first-party fields so the admin can see unique
--    visitors, visits, where people came from and what they browse on. No IP
--    address and no user-agent string is ever stored: visitor_id is a random
--    uuid the browser makes for itself, device is just mobile/tablet/desktop.
--    Existing rows keep NULL in all four and still count toward page views.
-- 2. get_traffic_metrics() returns every number the Metrics tab needs in one
--    call. It aggregates in SQL because PostgREST caps ordinary selects at 1000
--    rows, which would silently under-count.
--
-- Apply this BEFORE deploying the client change: the new analytics insert
-- sends these columns, and an insert naming an unknown column fails.

alter table public.page_views add column if not exists visitor_id uuid;
alter table public.page_views add column if not exists session_id uuid;
alter table public.page_views add column if not exists referrer_host text;
alter table public.page_views add column if not exists device text;

-- Anyone may insert page views (anonymous visitors), so keep the new columns tidy.
alter table public.page_views drop constraint if exists page_views_device_check;
alter table public.page_views
  add constraint page_views_device_check
  check (device is null or device in ('mobile', 'tablet', 'desktop'));

alter table public.page_views drop constraint if exists page_views_referrer_host_check;
alter table public.page_views
  add constraint page_views_referrer_host_check
  check (referrer_host is null or char_length(referrer_host) <= 255);

create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at desc);
create index if not exists page_views_visitor_id_idx on public.page_views (visitor_id) where visitor_id is not null;

-- The aggregation. Not callable by API roles: only the admin-checked wrapper below uses it.
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

  -- Day boundaries follow the viewer's time zone so "today" matches their clock.
  -- p_days = 0 means all time.
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
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- The only entry point for the app. Admin-checked, like the other dashboard reads.
create or replace function public.get_traffic_metrics(p_days int default 30, p_tz text default 'America/Toronto')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return public._traffic_metrics(p_days, p_tz);
end;
$$;

revoke all on function public._traffic_metrics(int, text) from public, anon, authenticated;
revoke all on function public.get_traffic_metrics(int, text) from public, anon;
grant execute on function public.get_traffic_metrics(int, text) to authenticated;

notify pgrst, 'reload schema';
