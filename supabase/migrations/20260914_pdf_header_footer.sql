-- Per-chant overrides for the header/footer stamped onto chant PDFs.
--
-- The stamp normally derives the header from "Book/Service - Title" and the
-- footer credit from the composer. These optional columns let an editor set
-- exact text for the finnicky cases, plus an extra phonetics-credit line:
--
--   pdf_header    : overrides the top-of-page "Book/Service - Title" line
--   pdf_credit    : overrides the "Text taken from ..." footer line
--   pdf_phonetics : optional extra footer line (e.g. phonetics attribution)
--
-- All are nullable; when null/blank the stamp falls back to the derived text.

alter table public.chants add column if not exists pdf_header text;
alter table public.chants add column if not exists pdf_credit text;
alter table public.chants add column if not exists pdf_phonetics text;
