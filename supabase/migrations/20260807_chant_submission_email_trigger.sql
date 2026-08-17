-- Emails the moderator whenever a chant is submitted for approval, directly from
-- Postgres via pg_net → Resend. This replaces the notify-chant-submission edge
-- function, so there is nothing to deploy — everything runs inside the database.
--
-- TWO ONE-TIME MANUAL STEPS (not in this migration — they involve a secret / the
-- dashboard):
--   1. Enable the pg_net extension if it isn't already:
--        Dashboard → Database → Extensions → search "pg_net" → enable.
--      (The guarded `create extension` below is a no-op if it's already on.)
--   2. Store the Resend API key in Vault — never commit the real key:
--        select vault.create_secret('re_your_key', 'resend_api_key');
--
-- Prerequisites: the 20260806_chant_submissions migration (creates the table),
-- supabase_vault enabled (default on Supabase), and a Resend-verified sender for
-- the FROM address below.

create extension if not exists pg_net;

create or replace function public.notify_chant_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  api_key text;
begin
  select decrypted_secret into api_key
  from vault.decrypted_secrets
  where name = 'resend_api_key'
  limit 1;

  -- No key configured yet → skip quietly rather than blocking the insert.
  if api_key is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Psaltikon Library <noreply@psaltikonlibrary.ca>',
      'to', jsonb_build_array('theorthodoxheritage@outlook.com'),
      'subject', 'New chant submitted for approval: ' || coalesce(new.title, 'Untitled'),
      'text', 'A chant titled "' || coalesce(new.title, 'Untitled') ||
              '" was submitted for approval. Open the admin dashboard to review it.'
    )
  );

  return new;
end;
$$;

drop trigger if exists on_chant_submission_created on public.chant_submissions;
create trigger on_chant_submission_created
  after insert on public.chant_submissions
  for each row execute function public.notify_chant_submission();
