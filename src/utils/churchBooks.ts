import { Chant } from '../types';

export const CHURCH_BOOKS = [
  'Anastasimatarion',
  'Divine Liturgy',
  'Menaion',
  'Triodion',
  'Pentecostarion',
  'Psalter',
  'General Services',
] as const;

export type ChurchBook = (typeof CHURCH_BOOKS)[number];

export const BOOK_DESCRIPTIONS: Record<string, string> = {
  Anastasimatarion: 'The resurrectional cycle of the eight tones.',
  'Divine Liturgy': 'Hymns of the Liturgy, ordered by hymn and tone.',
  Menaion: 'The fixed calendar, month by month.',
  Triodion: 'The lenten season, week by week.',
  Pentecostarion: 'Pascha through All Saints, week by week.',
  Psalter: 'The psalms, in order.',
  'General Services': 'Offices served throughout the year.',
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

/**
 * The fixed Great Feasts. These get their own folder directly under their month
 * instead of sitting under a single day, so hymns that span a forefeast /
 * afterfeast period have somewhere to live.
 *
 * The three movable Great Feasts (Palm Sunday, Ascension, Pentecost) have no
 * calendar month — they belong to the Triodion and Pentecostarion instead.
 */
export const GREAT_FEASTS: Array<{
  name: string;
  month: string;
  aliases: string[];
}> = [
  {
    name: 'Nativity of the Theotokos',
    month: 'September',
    aliases: ['nativity of the theotokos', 'birth of the theotokos'],
  },
  {
    name: 'Exaltation of the Holy Cross',
    month: 'September',
    aliases: [
      'exaltation of the holy cross',
      'elevation of the cross',
      'universal exaltation',
      'holy cross',
    ],
  },
  {
    name: 'Entrance of the Theotokos',
    month: 'November',
    aliases: [
      'entrance of the theotokos',
      'presentation of the theotokos',
      'entry of the theotokos',
    ],
  },
  {
    name: 'Nativity of Christ',
    month: 'December',
    aliases: ['nativity of christ', 'nativity of our lord', 'christmas', 'nativity'],
  },
  {
    name: 'Theophany',
    month: 'January',
    aliases: ['theophany', 'epiphany', 'baptism of christ'],
  },
  {
    name: 'Meeting of the Lord',
    month: 'February',
    aliases: ['meeting of the lord', 'presentation of the lord', 'hypapante', 'candlemas'],
  },
  { name: 'Annunciation', month: 'March', aliases: ['annunciation'] },
  { name: 'Transfiguration', month: 'August', aliases: ['transfiguration'] },
  {
    name: 'Dormition of the Theotokos',
    month: 'August',
    aliases: ['dormition of the theotokos', 'dormition theotokos', 'dormition', 'assumption'],
  },
];

export const GREAT_FEAST_NAMES = GREAT_FEASTS.map((feast) => feast.name);

/** Suggested sections for the Triodion; the first three are its standing offices. */
export const TRIODION_SECTIONS = [
  'Great Compline',
  'Akathist',
  'Canon of Saint Andrew',
  'Publican and Pharisee',
  'Prodigal Son',
  'Meatfare Sunday',
  'Cheesefare Sunday',
  'Sunday of Orthodoxy',
  'Saint Gregory Palamas',
  'Veneration of the Cross',
  'Saint John Climacus',
  'Saint Mary of Egypt',
  'Lazarus Saturday',
  'Palm Sunday',
  'Holy Week',
];

export const PENTECOSTARION_SECTIONS = [
  'Pascha',
  'Bright Week',
  'Thomas Sunday',
  'Myrrhbearing Women',
  'Paralytic',
  'Mid-Pentecost',
  'Samaritan Woman',
  'Blind Man',
  'Ascension',
  'Fathers of the First Council',
  'Pentecost',
  'All Saints',
];

export const SECTIONS_BY_BOOK: Record<string, string[]> = {
  Triodion: TRIODION_SECTIONS,
  Pentecostarion: PENTECOSTARION_SECTIONS,
};

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

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Longest aliases first so "Nativity of the Theotokos" wins over "Nativity".
const FEAST_ALIASES = GREAT_FEASTS.flatMap((feast) =>
  feast.aliases.map((alias) => ({ alias: normalize(alias), feast }))
).sort((a, b) => b.alias.length - a.alias.length);

/** The Great Feast a chant belongs to, matched loosely against its feast field. */
export function greatFeastOf(chant: Chant): { name: string; month: string } | null {
  const feast = normalize(text(chant.feast));
  if (!feast) return null;
  const hit = FEAST_ALIASES.find((entry) => feast.includes(entry.alias));
  return hit ? { name: hit.feast.name, month: hit.feast.month } : null;
}

export const isGreatFeastName = (value: string) => GREAT_FEAST_NAMES.includes(value);

// Longest section name first so "Mid-Pentecost" is not swallowed by "Pentecost".
const SECTION_MATCHERS: Record<string, Array<{ section: string; needle: string }>> =
  Object.fromEntries(
    Object.entries(SECTIONS_BY_BOOK).map(([bookName, sections]) => [
      bookName,
      sections
        .map((section) => ({ section, needle: normalize(section) }))
        .sort((a, b) => b.needle.length - a.needle.length),
    ])
  );

/**
 * Fall back to reading a Triodion / Pentecostarion section off a chant's other
 * fields when its week has not been set explicitly, so chants already tagged
 * with e.g. the feast "Pentecost" land in the right folder on their own.
 */
export function sectionFromChant(chant: Chant): string | null {
  const matchers = SECTION_MATCHERS[text(chant.book)];
  if (!matchers) return null;

  for (const raw of [chant.feast, chant.service, chant.part, chant.title]) {
    const value = normalize(text(raw));
    if (!value) continue;
    const hit = matchers.find((matcher) => value.includes(matcher.needle));
    if (hit) return hit.section;
  }
  return null;
}

// Sections read in their traditional sequence, not alphabetically. The Triodion's
// standing offices head its list, so they stay at the top of the book.
const SECTION_ORDER = new Map<string, number>();
[...TRIODION_SECTIONS, ...PENTECOSTARION_SECTIONS].forEach((section, index) => {
  if (!SECTION_ORDER.has(section)) SECTION_ORDER.set(section, index);
});

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

const weekThemeLevel: BookLevel = {
  label: 'Week',
  valueOf: (chant) => text(chant.week_theme) || sectionFromChant(chant) || UNSORTED,
  compare: (a, b) => {
    const ia = SECTION_ORDER.has(a) ? (SECTION_ORDER.get(a) as number) : Number.MAX_SAFE_INTEGER;
    const ib = SECTION_ORDER.has(b) ? (SECTION_ORDER.get(b) as number) : Number.MAX_SAFE_INTEGER;
    // Anything typed in by hand sorts after the traditional sequence.
    return ia === ib ? alphaNumeric(a, b) : ia - ib;
  },
};

/** Menaion month — a Great Feast falls back to its own calendar month. */
const menaionMonthLevel: BookLevel = {
  label: 'Month',
  valueOf: (chant) => {
    const stored = text(chant.menaion_month);
    if (stored) return stored;
    return greatFeastOf(chant)?.month || UNSORTED;
  },
  compare: (a, b) => {
    const ia = MENAION_MONTHS.indexOf(a);
    const ib = MENAION_MONTHS.indexOf(b);
    if (ia === -1 && ib === -1) return alphaNumeric(a, b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  },
};

/**
 * Inside a month: Great Feasts get their own folder, everything else is filed
 * under its day. Feasts sort above the days.
 */
const menaionMonthChildLevel: BookLevel = {
  label: 'Feast or day',
  valueOf: (chant) => {
    const feast = greatFeastOf(chant);
    if (feast) return feast.name;
    return typeof chant.menaion_day === 'number' && !Number.isNaN(chant.menaion_day)
      ? String(chant.menaion_day)
      : UNSORTED;
  },
  compare: (a, b) => {
    const aFeast = isGreatFeastName(a);
    const bFeast = isGreatFeastName(b);
    if (aFeast && !bFeast) return -1;
    if (!aFeast && bFeast) return 1;
    if (aFeast && bFeast) {
      return GREAT_FEAST_NAMES.indexOf(a) - GREAT_FEAST_NAMES.indexOf(b);
    }
    return alphaNumeric(a, b);
  },
};

const psalmLevel: BookLevel = {
  label: 'Psalm',
  valueOf: (chant) =>
    typeof chant.psalm_number === 'number' && !Number.isNaN(chant.psalm_number)
      ? `Psalm ${chant.psalm_number}`
      : UNSORTED,
  compare: alphaNumeric,
};

const BOOK_LEVELS: Record<string, BookLevel[]> = {
  Anastasimatarion: [toneLevel, serviceLevel, hymnLevel],
  'Divine Liturgy': [hymnLevel, toneLevel],
  Menaion: [menaionMonthLevel, menaionMonthChildLevel, feastLevel],
  Triodion: [weekThemeLevel, serviceLevel],
  Pentecostarion: [weekThemeLevel, serviceLevel],
  Psalter: [psalmLevel],
  'General Services': [serviceLevel],
};

/**
 * The levels that apply at a given position. Depth is usually fixed per book,
 * but the Menaion is shallower down a Great Feast branch: the feast replaces
 * the day, and its folder is already the leaf.
 */
export function levelsForPath(book: string, path: string[] = []): BookLevel[] {
  const levels = BOOK_LEVELS[book] || [];
  if (book === 'Menaion' && path[1] && isGreatFeastName(path[1])) {
    return [menaionMonthLevel, menaionMonthChildLevel];
  }
  return levels;
}

/** Chants filed under a book, narrowed by the folders already opened. */
export function chantsAtPath(chants: Chant[], book: string, path: string[]): Chant[] {
  const levels = levelsForPath(book, path);
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
  const levels = levelsForPath(book, path);
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
