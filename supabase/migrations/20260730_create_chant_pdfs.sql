-- Multiple PDFs per chant. chants.pdf_path remains the primary PDF for
-- backward compatibility (booklets and older clients keep working).

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

create table if not exists public.chant_pdfs (
  id uuid primary key default gen_random_uuid(),
  chant_id uuid not null references public.chants(id) on delete cascade,
  pdf_path text not null,
  label text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.chant_pdfs enable row level security;

drop policy if exists "Anyone can read chant pdfs" on public.chant_pdfs;
create policy "Anyone can read chant pdfs"
on public.chant_pdfs
for select
using (true);

drop policy if exists "Authenticated users can add chant pdfs" on public.chant_pdfs;
create policy "Authenticated users can add chant pdfs"
on public.chant_pdfs
for insert
with check (auth.uid() is not null);

drop policy if exists "Admins can update chant pdfs" on public.chant_pdfs;
create policy "Admins can update chant pdfs"
on public.chant_pdfs
for update
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Admins can delete chant pdfs" on public.chant_pdfs;
create policy "Admins can delete chant pdfs"
on public.chant_pdfs
for delete
using (public.is_current_user_admin());

create index if not exists chant_pdfs_chant_id_idx
  on public.chant_pdfs (chant_id, sort_order, created_at);

-- Backfill: every chant's existing primary PDF becomes its first chant_pdfs row.
insert into public.chant_pdfs (chant_id, pdf_path, sort_order)
select c.id, c.pdf_path, 0
from public.chants c
where c.pdf_path is not null
  and not exists (
    select 1 from public.chant_pdfs cp
    where cp.chant_id = c.id and cp.pdf_path = c.pdf_path
  );
