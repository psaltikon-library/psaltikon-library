-- Booklets: user-compiled collections of chants that can be exported as a single PDF.
-- Assumes public.chants.id is uuid and public.profiles(id, username) exists.

create table if not exists public.booklets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  -- Denormalized author display name so public listings don't depend on profiles RLS.
  author_name text,
  is_public boolean not null default false,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booklet_chants (
  id uuid primary key default gen_random_uuid(),
  booklet_id uuid not null references public.booklets(id) on delete cascade,
  chant_id uuid not null references public.chants(id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  unique (booklet_id, chant_id)
);

alter table public.booklets enable row level security;
alter table public.booklet_chants enable row level security;

-- ── booklets policies ──────────────────────────────────────────────────────
-- Anyone can read public booklets; owners can read their own (public or private).
do $$ begin
  create policy "Read public or own booklets"
    on public.booklets for select
    using (is_public or auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Insert own booklets"
    on public.booklets for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Update own booklets"
    on public.booklets for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Delete own booklets"
    on public.booklets for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── booklet_chants policies (gated on the parent booklet) ───────────────────
do $$ begin
  create policy "Read chants of visible booklets"
    on public.booklet_chants for select
    using (
      exists (
        select 1 from public.booklets b
        where b.id = booklet_id
          and (b.is_public or b.user_id = auth.uid())
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Modify chants of own booklets (insert)"
    on public.booklet_chants for insert
    with check (
      exists (
        select 1 from public.booklets b
        where b.id = booklet_id and b.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Modify chants of own booklets (update)"
    on public.booklet_chants for update
    using (
      exists (
        select 1 from public.booklets b
        where b.id = booklet_id and b.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Modify chants of own booklets (delete)"
    on public.booklet_chants for delete
    using (
      exists (
        select 1 from public.booklets b
        where b.id = booklet_id and b.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ── download counter ────────────────────────────────────────────────────────
-- Security-definer so any visitor downloading a public booklet can bump its count
-- without being able to update other columns.
create or replace function public.increment_booklet_downloads(p_booklet_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.booklets
     set download_count = download_count + 1
   where id = p_booklet_id and is_public = true;
$$;

grant execute on function public.increment_booklet_downloads(uuid) to anon, authenticated;

create index if not exists booklets_user_id_idx on public.booklets (user_id);
create index if not exists booklets_public_idx on public.booklets (is_public, download_count desc);
create index if not exists booklet_chants_booklet_id_idx on public.booklet_chants (booklet_id);
create index if not exists booklet_chants_chant_id_idx on public.booklet_chants (chant_id);
