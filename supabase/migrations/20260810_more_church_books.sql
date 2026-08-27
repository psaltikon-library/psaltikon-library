-- Triodion / Pentecostarion / General Services.
--
--   Triodion        : Week or section -> Service   (sections include Great
--                     Compline, Akathist, Canon of Saint Andrew)
--   Pentecostarion  : Week or section -> Service
--   General Services: Service
--
-- Triodion and Pentecostarion are ordered by their week theme, which needs one
-- new field. General Services reuses the existing service column.

alter table public.chants add column if not exists week_theme text;
alter table public.chant_submissions add column if not exists week_theme text;

create index if not exists chants_week_theme_idx on public.chants (week_theme);
