-- Church book directory ("Services" page): every chant can be filed under one
-- church book, plus the extra coordinates two of those books are ordered by.
--
--   Anastasimatarion : Tone   -> Service -> Hymn
--   Divine Liturgy   : Hymn   -> Tone
--   Menaion          : Month  -> Day     -> Feast   (needs menaion_month/day)
--   Psalter          : Psalm number                 (needs psalm_number)
--
-- Existing chants are intentionally left unassigned; they appear in the
-- directory once a book is set on them.

alter table public.chants add column if not exists book text;
alter table public.chants add column if not exists psalm_number integer;
alter table public.chants add column if not exists menaion_month text;
alter table public.chants add column if not exists menaion_day integer;

-- Mirror the same fields on user submissions so a suggested chant keeps its
-- placement when an admin approves it.
alter table public.chant_submissions add column if not exists book text;
alter table public.chant_submissions add column if not exists psalm_number integer;
alter table public.chant_submissions add column if not exists menaion_month text;
alter table public.chant_submissions add column if not exists menaion_day integer;

create index if not exists chants_book_idx on public.chants (book);
