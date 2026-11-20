/**
 * One-shot hand-off from the homepage to the library: a search term and/or a
 * tone to start with. The library reads it once when it mounts and clears it,
 * so a later visit to the library starts unfiltered.
 */
export interface LibraryPreset {
  query?: string;
  tone?: string;
}

const KEY = 'psaltikon_library_preset';

export function setLibraryPreset(preset: LibraryPreset) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(preset));
  } catch {
    // Storage can be blocked; the library then simply opens unfiltered.
  }
}

export function peekLibraryPreset(): LibraryPreset | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LibraryPreset) : null;
  } catch {
    return null;
  }
}

export function clearLibraryPreset() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
