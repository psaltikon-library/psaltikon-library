-- Add a composer field to user chant submissions, mirroring the admin upload form.
alter table public.chant_submissions add column if not exists composer text;
