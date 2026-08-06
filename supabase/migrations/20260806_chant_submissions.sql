-- Chant submissions: user-submitted chants (same shape as an admin upload) that
-- wait in a quarantine table for admin approval before becoming real chants.
-- Assumes public.chants, public.chant_pdfs, and public.profiles(id, admin) exist,
-- and a public "chant-pdfs" storage bucket.

create table if not exists public.chant_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  tone text,
  feast text,
  service text,
  part text,
  language text,
  -- Storage paths (in the chant-pdfs bucket) of the uploaded PDFs, in order.
  pdf_paths text[] not null default '{}',
  pdf_labels text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_chant_id uuid references public.chants(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.chant_submissions enable row level security;

-- Reusable admin predicate.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.admin = true
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Any signed-in user may submit; the row must be attributed to them.
do $$ begin
  create policy "Users insert their own submissions"
    on public.chant_submissions for insert
    with check (auth.uid() = submitted_by);
exception when duplicate_object then null; end $$;

-- Submitters can see their own; admins can see everything.
do $$ begin
  create policy "Read own or admin reads all submissions"
    on public.chant_submissions for select
    using (auth.uid() = submitted_by or public.is_admin());
exception when duplicate_object then null; end $$;

-- Only admins review (approve / reject / edit).
do $$ begin
  create policy "Admins update submissions"
    on public.chant_submissions for update
    using (public.is_admin())
    with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins delete submissions"
    on public.chant_submissions for delete
    using (public.is_admin());
exception when duplicate_object then null; end $$;

create index if not exists chant_submissions_status_idx
  on public.chant_submissions (status, created_at desc);
create index if not exists chant_submissions_submitted_by_idx
  on public.chant_submissions (submitted_by);

-- ── Storage: let signed-in users upload PDFs under the submissions/ prefix ────
-- (Admin uploads use the chants/ prefix; this narrowly allows public submissions
--  without granting write access to the rest of the bucket.)
do $$ begin
  create policy "Authenticated upload chant submission PDFs"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'chant-pdfs' and name like 'submissions/%');
exception when duplicate_object then null; end $$;

-- Allow submitters/admins to clean up their own submission uploads.
do $$ begin
  create policy "Owners manage their submission PDFs"
    on storage.objects for delete to authenticated
    using (bucket_id = 'chant-pdfs' and name like 'submissions/%' and owner = auth.uid());
exception when duplicate_object then null; end $$;
