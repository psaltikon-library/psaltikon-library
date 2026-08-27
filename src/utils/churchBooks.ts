import { Chant } from '../types';

export const CHURCH_BOOKS = [
  'Anastasimatarion',
  'Divine Liturgy',
  'Menaion',
  'Psalter',
] as const;

export type ChurchBook = (typeof CHURCH_BOOKS)[number];

export const BOOK_DESCRIPTIONS: Record<string, string> = {
  Anastasimatarion: 'The resurrectional cycle of the eight tones.',
  'Divine Liturgy': 'Hymns of the Liturgy, ordered by hymn and tone.',
  Menaion: 'The fixed calendar, month by month.',
  Psalter: 'The psalms, in order.',
};

/** The ecclesiastical year begins in September. */
export const MENAION_MONTHS = [
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
];

/** Bucket for chants missing a value at some level — shown last, never hidden. */
export const UNSORTED = 'Unsorted';

export const UNKNOWN_COMPOSER = 'Unknown composer';

export interface BookLevel {
  /** Heading shown for this depth, e.g. "Tone". */
  label: string;
  /** The folder a chant belongs to at this depth. */
  valueOf: (chant: Chant) => string;
  compare?: (a: string, b: string) => number;
}

const alphaNumeric = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const toneLevel: BookLevel = {
  label: 'Tone',
  valueOf: (chant) => text(chant.tone) || UNSORTED,
  compare: alphaNumeric,
};

const serviceLevel: BookLevel = {
  label: 'Service',
  valueOf: (chant) => text(chant.service) || UNSORTED,
  compare: alphaNumeric,
};

const hymnLevel: BookLevel = {
  label: 'Hymn',
  valueOf: (chant) => text(chant.part) || UNSORTED,
  compare: alphaNumeric,
};

const feastLevel: BookLevel = {
  label: 'Feast',
  valueOf: (chant) => text(chant.feast) || UNSORTED,
  compare: alphaNumeric,
};

const monthLevel: BookLevel = {
  label: 'Month',
  valueOf: (chant) => text(chant.menaion_month) || UNSORTED,
  compare: (a, b) => {
    const ia = MENAION_MONTHS.indexOf(a);
    const ib = MENAION_MONTHS.indexOf(b);
    if (ia === -1 && ib === -1) return alphaNumeric(a, b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  },
};

const dayLevel: BookLevel = {
  label: 'Day',
  valueOf: (chant) =>
    typeof chant.menaion_day === 'number' && !Number.isNaN(chant.menaion_day)
      ? String(chant.menaion_day)
      : UNSORTED,
  compare: alphaNumeric,
};

const psalmLevel: BookLevel = {
  label: 'Psalm',
  valueOf: (chant) =>
    typeof chant.psalm_number === 'number' && !Number.isNaN(chant.psalm_number)
      ? `Psalm ${chant.psalm_number}`
      : UNSORTED,
  compare: alphaNumeric,
};

export const BOOK_LEVELS: Record<string, BookLevel[]> = {
  Anastasimatarion: [toneLevel, serviceLevel, hymnLevel],
  'Divine Liturgy': [hymnLevel, toneLevel],
  Menaion: [monthLevel, dayLevel, feastLevel],
  Psalter: [psalmLevel],
};

export const levelsForBook = (book: string): BookLevel[] => BOOK_LEVELS[book] || [];

/** Chants filed under a book, narrowed by the folders already opened. */
export function chantsAtPath(chants: Chant[], book: string, path: string[]): Chant[] {
  const levels = levelsForBook(book);
  return chants.filter((chant) => {
    if (text(chant.book) !== book) return false;
    return path.every((value, depth) => {
      const level = levels[depth];
      return level ? level.valueOf(chant) === value : true;
    });
  });
}

export interface DirectoryFolder {
  name: string;
  count: number;
}

/** The folders to show at the current depth, with how many chants each holds. */
export function foldersAtPath(chants: Chant[], book: string, path: string[]): DirectoryFolder[] {
  const levels = levelsForBook(book);
  const level = levels[path.length];
  if (!level) return [];

  const counts = new Map<string, number>();
  chantsAtPath(chants, book, path).forEach((chant) => {
    const name = level.valueOf(chant);
    counts.set(name, (counts.get(name) || 0) + 1);
  });

  const compare = level.compare || alphaNumeric;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      // Keep the catch-all bucket at the bottom.
      if (a.name === UNSORTED) return 1;
      if (b.name === UNSORTED) return -1;
      return compare(a.name, b.name);
    });
}

export interface ComposerGroup {
  composer: string;
  chants: Chant[];
}

/** Leaf listing: chants grouped by composer before the PDFs themselves. */
export function groupByComposer(chants: Chant[]): ComposerGroup[] {
  const groups = new Map<string, Chant[]>();
  chants.forEach((chant) => {
    const composer = text(chant.composer) || UNKNOWN_COMPOSER;
    groups.set(composer, [...(groups.get(composer) || []), chant]);
  });

  return Array.from(groups.entries())
    .map(([composer, list]) => ({ composer, chants: list }))
    .sort((a, b) => {
      if (a.composer === UNKNOWN_COMPOSER) return 1;
      if (b.composer === UNKNOWN_COMPOSER) return -1;
      return alphaNumeric(a.composer, b.composer);
    });
}

/** How many chants are filed under each book. */
export function countByBook(chants: Chant[]): Record<string, number> {
  const counts: Record<string, number> = {};
  CHURCH_BOOKS.forEach((book) => {
    counts[book] = 0;
  });
  chants.forEach((chant) => {
    const book = text(chant.book);
    if (book in counts) counts[book] += 1;
  });
  return counts;
}
