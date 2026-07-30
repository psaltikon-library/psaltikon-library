-- Editable filter options for the chant upload form.

-- Admin check helper. Normally created by 20260601_admin_dashboard.sql; created
-- here too so this migration can run standalone. An existing definition is left
-- untouched. Written in plpgsql so it can be created before public.profiles
-- exists, returning false rather than erroring in that case.
do $bootstrap$
begin
  if to_regprocedure('public.is_current_user_admin()') is null then
    execute $fn$
      create function public.is_current_user_admin()
      returns boolean
      language plpgsql
      stable
      security definer
      set search_path = public
      as $body$
      declare
        result boolean;
      begin
        select admin into result from public.profiles where id = auth.uid();
        return coalesce(result, false);
      exception
        when undefined_table then
          return false;
      end;
      $body$;
    $fn$;
  end if;
end
$bootstrap$;

create table if not exists public.filter_options (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('part', 'tone', 'service', 'feast', 'language')),
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category, value)
);

alter table public.filter_options enable row level security;

drop policy if exists "Anyone can read filter options" on public.filter_options;
create policy "Anyone can read filter options"
on public.filter_options
for select
using (true);

drop policy if exists "Admins can insert filter options" on public.filter_options;
create policy "Admins can insert filter options"
on public.filter_options
for insert
with check (public.is_current_user_admin());

drop policy if exists "Admins can update filter options" on public.filter_options;
create policy "Admins can update filter options"
on public.filter_options
for update
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Admins can delete filter options" on public.filter_options;
create policy "Admins can delete filter options"
on public.filter_options
for delete
using (public.is_current_user_admin());

create index if not exists filter_options_category_idx
  on public.filter_options (category, sort_order, value);

-- Seed with the options previously hardcoded in the upload form.
insert into public.filter_options (category, value, sort_order) values
  ('part', 'Apolytikion', 10),
  ('part', 'Kekregaria', 20),
  ('part', 'Aposticha', 30),
  ('part', 'Doxastikon', 40),
  ('part', 'Theotokion', 50),
  ('part', 'Praises', 60),
  ('part', 'Katavasia', 70),
  ('part', 'Kontakion', 80),
  ('part', 'Troparion', 90),
  ('part', 'Stichera', 100),
  ('part', 'Cherubikon', 110),
  ('part', 'Doxology', 120),
  ('part', 'Megalynarion', 130),
  ('part', 'Koinonikon', 140),
  ('part', 'Polyeleos', 150),
  ('part', 'Anixantaria', 160),
  ('part', 'Alleluia', 170),
  ('part', 'Trisagion', 180),
  ('part', 'Psalm', 190),
  ('tone', 'Tone 1', 10),
  ('tone', 'Tone 2', 20),
  ('tone', 'Tone 3', 30),
  ('tone', 'Tone 4', 40),
  ('tone', 'Tone 5', 50),
  ('tone', 'Tone 6', 60),
  ('tone', 'Tone 7', 70),
  ('tone', 'Tone 8', 80),
  ('service', 'Divine Liturgy', 10),
  ('service', 'Matins', 20),
  ('service', 'Vespers', 30),
  ('service', 'Orthros', 40),
  ('service', 'Compline', 50),
  ('service', 'Psalms', 60),
  ('service', 'Special', 70),
  ('feast', 'Pascha', 10),
  ('feast', 'Nativity', 20),
  ('feast', 'Theophany', 30),
  ('feast', 'Pentecost', 40),
  ('feast', 'Sunday', 50),
  ('language', 'Arabic', 10),
  ('language', 'Arabic Phonetics', 20),
  ('language', 'Greek', 30),
  ('language', 'Greek Phonetics', 40),
  ('language', 'English', 50),
  ('language', 'French', 60)
on conflict (category, value) do nothing;
