-- Assumes public.chants.id is uuid, which matches the app's chant ID generation.

create table if not exists public.saved_chants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chant_id uuid not null references public.chants(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique (user_id, chant_id)
);

alter table public.saved_chants enable row level security;

do $$
begin
  create policy "Users can read their own saved chants"
    on public.saved_chants
    for select
    using (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can insert their own saved chants"
    on public.saved_chants
    for insert
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can delete their own saved chants"
    on public.saved_chants
    for delete
    using (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

create index if not exists saved_chants_user_id_idx
  on public.saved_chants (user_id);

create index if not exists saved_chants_chant_id_idx
  on public.saved_chants (chant_id);