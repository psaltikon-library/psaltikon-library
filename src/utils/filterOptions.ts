import { supabase } from '../lib/supabase';

export type FilterCategory = 'part' | 'tone' | 'service' | 'feast' | 'language';

export type FilterOptionRow = {
  id: string;
  category: FilterCategory;
  value: string;
  sort_order: number;
};

export type FilterOptionsByCategory = Record<FilterCategory, FilterOptionRow[]>;

export const FILTER_CATEGORIES: FilterCategory[] = ['part', 'tone', 'service', 'feast', 'language'];

export const FILTER_CATEGORY_LABELS: Record<FilterCategory, string> = {
  part: 'Part of Service',
  tone: 'Tone (Echos)',
  service: 'Service',
  feast: 'Feast',
  language: 'Language',
};

// Fallback when the filter_options table is unavailable (e.g., migration not run yet).
export const DEFAULT_FILTER_OPTIONS: Record<FilterCategory, string[]> = {
  part: [
    'Apolytikion', 'Kekregaria', 'Aposticha', 'Doxastikon', 'Theotokion', 'Praises',
    'Katavasia', 'Kontakion', 'Troparion', 'Stichera', 'Cherubikon', 'Doxology',
    'Megalynarion', 'Koinonikon', 'Polyeleos', 'Anixantaria', 'Alleluia', 'Trisagion', 'Psalm',
  ],
  tone: ['Tone 1', 'Tone 2', 'Tone 3', 'Tone 4', 'Tone 5', 'Tone 6', 'Tone 7', 'Tone 8'],
  service: ['Divine Liturgy', 'Matins', 'Vespers', 'Orthros', 'Compline', 'Psalms', 'Special'],
  feast: ['Pascha', 'Nativity', 'Theophany', 'Pentecost', 'Sunday'],
  language: ['Arabic', 'Arabic Phonetics', 'Greek', 'Greek Phonetics', 'English', 'French'],
};

const emptyByCategory = (): FilterOptionsByCategory => ({
  part: [],
  tone: [],
  service: [],
  feast: [],
  language: [],
});

// Alphabetical, but digit-aware so "Tone 2" sorts before "Tone 10" rather than
// after it. Used everywhere filter options are listed.
export const compareFilterValues = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export async function loadFilterOptions(): Promise<FilterOptionsByCategory> {
  const { data, error } = await supabase
    .from('filter_options')
    .select('id, category, value, sort_order')
    .order('value', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to load filter options.');
  }

  const grouped = emptyByCategory();
  ((data || []) as FilterOptionRow[]).forEach((row) => {
    if (grouped[row.category]) grouped[row.category].push(row);
  });

  FILTER_CATEGORIES.forEach((category) => {
    grouped[category].sort((a, b) => compareFilterValues(a.value, b.value));
  });

  return grouped;
}

// Values for the upload form selects. Falls back to the defaults per category
// when the table is missing or a category has no rows. Always alphabetical.
export async function loadFilterValues(): Promise<Record<FilterCategory, string[]>> {
  const sortedDefaults = () => {
    const defaults = {} as Record<FilterCategory, string[]>;
    FILTER_CATEGORIES.forEach((category) => {
      defaults[category] = [...DEFAULT_FILTER_OPTIONS[category]].sort(compareFilterValues);
    });
    return defaults;
  };

  try {
    const grouped = await loadFilterOptions();
    const result = sortedDefaults();
    FILTER_CATEGORIES.forEach((category) => {
      const values = grouped[category].map((row) => row.value);
      if (values.length > 0) result[category] = values;
    });
    return result;
  } catch {
    return sortedDefaults();
  }
}

export async function addFilterOption(category: FilterCategory, value: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from('filter_options')
    .insert({ category, value, sort_order: sortOrder });

  if (error) {
    if (error.code === '23505') {
      throw new Error(`"${value}" already exists in ${FILTER_CATEGORY_LABELS[category]}.`);
    }
    throw new Error(error.message || 'Failed to add filter option. (Are you signed in as an admin?)');
  }
}

export async function renameFilterOption(id: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('filter_options')
    .update({ value })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      throw new Error(`"${value}" already exists in that category.`);
    }
    throw new Error(error.message || 'Failed to rename filter option. (Are you signed in as an admin?)');
  }
}

export async function deleteFilterOption(id: string): Promise<void> {
  const { error } = await supabase
    .from('filter_options')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete filter option. (Are you signed in as an admin?)');
  }
}
