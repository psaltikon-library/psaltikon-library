-- Admin dashboard support tables.
-- Assumes public.chants.id is uuid and auth.users is available.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  first_name text,
  last_name text,
  admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  chant_id uuid references public.chants(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create table if not exists public.chant_views (
  id uuid primary key default gen_random_uuid(),
  chant_id uuid not null references public.chants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create table if not exists public.chant_suggestions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.page_views enable row level security;
alter table public.chant_views enable row level security;
alter table public.chant_suggestions enable row level security;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select admin from public.profiles where id = auth.uid()), false);
$$;

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
    elsif tg_op = 'UPDATE' then
      new.admin := coalesce(old.admin, false);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_admin_escalation on public.profiles;
create trigger profiles_prevent_admin_escalation
before insert or update on public.profiles
for each row
execute function public.prevent_profile_admin_escalation();

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles
for select
using (public.is_current_user_admin());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles
for update
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Anyone can record page views" on public.page_views;
create policy "Anyone can record page views"
on public.page_views
for insert
with check (true);

drop policy if exists "Admins can view page views" on public.page_views;
create policy "Admins can view page views"
on public.page_views
for select
using (public.is_current_user_admin());

drop policy if exists "Anyone can record chant views" on public.chant_views;
create policy "Anyone can record chant views"
on public.chant_views
for insert
with check (true);

drop policy if exists "Admins can view chant views" on public.chant_views;
create policy "Admins can view chant views"
on public.chant_views
for select
using (public.is_current_user_admin());

drop policy if exists "Authenticated users can submit suggestions" on public.chant_suggestions;
create policy "Authenticated users can submit suggestions"
on public.chant_suggestions
for insert
with check (auth.uid() = submitted_by);

drop policy if exists "Admins can view suggestions" on public.chant_suggestions;
create policy "Admins can view suggestions"
on public.chant_suggestions
for select
using (public.is_current_user_admin());

drop policy if exists "Admins can update suggestions" on public.chant_suggestions;
create policy "Admins can update suggestions"
on public.chant_suggestions
for update
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Admins can delete suggestions" on public.chant_suggestions;
create policy "Admins can delete suggestions"
on public.chant_suggestions
for delete
using (public.is_current_user_admin());

create index if not exists page_views_route_idx
  on public.page_views (route);

create index if not exists page_views_chant_id_idx
  on public.page_views (chant_id);

create index if not exists page_views_viewed_at_idx
  on public.page_views (viewed_at desc);

create index if not exists chant_views_chant_id_idx
  on public.chant_views (chant_id);

create index if not exists chant_views_viewed_at_idx
  on public.chant_views (viewed_at desc);

create index if not exists chant_suggestions_status_idx
  on public.chant_suggestions (status);

create index if not exists chant_suggestions_created_at_idx
  on public.chant_suggestions (created_at desc);

create or replace view public.page_view_stats as
select
  route,
  count(*)::bigint as view_count,
  max(viewed_at) as last_viewed_at
from public.page_views
group by route;

create or replace view public.chant_view_stats as
select
  chant_id,
  count(*)::bigint as view_count,
  max(viewed_at) as last_viewed_at
from public.chant_views
group by chant_id;

create or replace view public.chant_save_stats as
select
  chant_id,
  count(*)::bigint as save_count,
  max(saved_at) as last_saved_at
from public.saved_chants
group by chant_id;