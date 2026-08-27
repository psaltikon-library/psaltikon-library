export type Page = 'home' | 'library' | 'chant-detail' | 'phonetics' | 'booklets' | 'services' | 'compositions' | 'about' | 'admin' | 'saved-items';

export interface Chant {
  id: string;
  title: string;
  titleGreek?: string;
  tone: string;
  feast: string;
  service: string;
  part: string;
  language: string;
  pdfPath: string;
  hasPhonetics?: boolean;
  phoneticsText?: string;
  composer?: string;
  category?: string;
  /** Church book this chant is filed under on the Services directory. */
  book?: string | null;
  /** Psalter ordering. */
  psalm_number?: number | null;
  /** Menaion ordering (ecclesiastical calendar). */
  menaion_month?: string | null;
  menaion_day?: number | null;
}

export interface Booklet {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  author_name?: string | null;
  is_public: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  /** Derived: number of chants in the booklet (from a count join). */
  chantCount?: number;
  /** Populated when a booklet is loaded together with its chants. */
  chants?: Chant[];
}
