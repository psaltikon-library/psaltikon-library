export type Page = 'home' | 'library' | 'chant-detail' | 'phonetics' | 'compositions' | 'about' | "admin";

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
}
