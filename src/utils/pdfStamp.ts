import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFFont,
  PDFPage,
  PDFName,
  PDFString,
  Color,
} from 'pdf-lib';
import { Chant } from '../types';

const MUTED = rgb(0.42, 0.4, 0.36);
const BURGUNDY = rgb(0.545, 0.149, 0.208); // #8B2635

const CONTACT_EMAIL = 'theorthodoxheritage@outlook.com';
const DEFAULT_PHONETICS =
  'Phonetics provided by Gabriel Zohrob and adapted by Kevin El-Saikali';

// pdf-lib's standard fonts are WinAnsi-only, so drop anything they can't encode
// (stray Greek/accented glyphs) before drawing — headers/footers are English.
function winAnsiSafe(text: string): string {
  return (text || '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '').replace(/\s+/g, ' ').trim();
}

function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && font.widthOfTextAtSize(`${out}…`, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}…`;
}

/** Overlay a clickable link annotation on a page region (PDF user space). */
function addLinkAnnotation(
  doc: PDFDocument,
  page: PDFPage,
  rect: [number, number, number, number],
  uri: string
) {
  const link = doc.context.register(
    doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: rect,
      Border: [0, 0, 0],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(uri),
      },
    })
  );
  const annots = page.node.Annots();
  if (annots) {
    annots.push(link);
  } else {
    page.node.set(PDFName.of('Annots'), doc.context.obj([link]));
  }
}

/**
 * Top-of-page line. Uses the chant's `pdf_header` override when set, otherwise
 * derives "Service/book - Feast - Chant type" (e.g. "Psalter - Nativity -
 * Communion Hymn"), dropping the feast when the chant has none.
 */
export function headerLine(chant: Chant): string {
  const override = (chant.pdf_header || '').trim();
  if (override) return winAnsiSafe(override);
  const primary = (chant.book || chant.service || '').trim();
  const feast = (chant.feast || '').trim();
  const part = (chant.part || '').trim();
  return winAnsiSafe([primary, feast, part].filter(Boolean).join(' - '));
}

/**
 * Footer credit naming the source. Uses the chant's `pdf_credit` override when
 * set; otherwise credits the composer (Subdeacon George → the Archdiocese).
 */
export function composerCredit(chant: Chant): string {
  const override = (chant.pdf_credit || '').trim();
  if (override) return winAnsiSafe(override);
  const composer = (chant.composer || '').trim();
  if (/subdeacon\s+george/i.test(composer)) {
    return 'Text taken from the Antiochian Archdiocese of North America.';
  }
  if (composer) {
    return winAnsiSafe(`Text taken from ${composer}.`);
  }
  return '';
}

/**
 * Optional phonetics-credit footer line. Uses the chant's `pdf_phonetics`
 * override when set; otherwise auto-fills the standard credit for Arabic and
 * Greek chants only, and stays empty for every other language.
 */
export function phoneticsCredit(chant: Chant): string {
  const override = (chant.pdf_phonetics || '').trim();
  if (override) return winAnsiSafe(override);
  const language = (chant.language || '').toLowerCase();
  if (/arab|greek/.test(language)) return DEFAULT_PHONETICS;
  return '';
}

/**
 * Draw a header (book/service + title) and footer (source credit + Orthodox
 * Heritage copyright and contact email) onto every page of a chant PDF, and
 * return the new bytes. Written once here; applies to any chant's PDF.
 */
export async function stampHeaderFooter(
  input: ArrayBuffer | Uint8Array,
  chant: Chant
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(input, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const header = headerLine(chant);
  const copyrightPrefix = `© ${new Date().getFullYear()} The Orthodox Heritage · `;

  // Optional footer lines stacked above the always-present copyright line.
  const optionalLines = [
    { text: composerCredit(chant), font: italic },
    { text: phoneticsCredit(chant), font: italic },
  ].filter((line) => line.text);

  const MARGIN = 34;
  const HEADER_SIZE = 9;
  const FOOT_SIZE = 7.5;
  const FOOT_GAP = 11; // baseline-to-baseline spacing
  const FOOT_BOTTOM = 14; // baseline of the lowest line

  const drawCentered = (
    page: PDFPage,
    text: string,
    y: number,
    f: PDFFont,
    size: number,
    color: Color
  ) => {
    if (!text) return;
    const maxWidth = page.getWidth() - MARGIN * 2;
    const line = truncateToWidth(text, f, size, maxWidth);
    const w = f.widthOfTextAtSize(line, size);
    page.drawText(line, { x: (page.getWidth() - w) / 2, y, size, font: f, color });
  };

  // Copyright line, centered, with the email drawn in burgundy + underlined and
  // wrapped in a clickable mailto link.
  const drawCopyright = (page: PDFPage, y: number) => {
    const prefixW = font.widthOfTextAtSize(copyrightPrefix, FOOT_SIZE);
    const emailW = font.widthOfTextAtSize(CONTACT_EMAIL, FOOT_SIZE);
    const startX = (page.getWidth() - (prefixW + emailW)) / 2;
    const emailX = startX + prefixW;

    page.drawText(copyrightPrefix, { x: startX, y, size: FOOT_SIZE, font, color: MUTED });
    page.drawText(CONTACT_EMAIL, { x: emailX, y, size: FOOT_SIZE, font, color: BURGUNDY });
    page.drawLine({
      start: { x: emailX, y: y - 1.5 },
      end: { x: emailX + emailW, y: y - 1.5 },
      thickness: 0.5,
      color: BURGUNDY,
      opacity: 0.8,
    });
    addLinkAnnotation(
      doc,
      page,
      [emailX, y - 2, emailX + emailW, y + FOOT_SIZE],
      `mailto:${CONTACT_EMAIL}`
    );
  };

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();

    // Header — title line with a thin gold rule beneath it.
    if (header) {
      drawCentered(page, header, height - 24, bold, HEADER_SIZE, BURGUNDY);
      page.drawRectangle({
        x: MARGIN,
        y: height - 31,
        width: width - MARGIN * 2,
        height: 0.6,
        color: BURGUNDY,
        opacity: 0.7,
      });
    }

    // Footer — a gold rule above the stacked credit/phonetics/copyright lines.
    const n = optionalLines.length + 1; // + the copyright line
    const topBaseline = FOOT_BOTTOM + (n - 1) * FOOT_GAP;
    page.drawRectangle({
      x: MARGIN,
      y: topBaseline + 8,
      width: width - MARGIN * 2,
      height: 0.6,
      color: BURGUNDY,
      opacity: 0.7,
    });
    optionalLines.forEach((line, i) => {
      const y = FOOT_BOTTOM + (n - 1 - i) * FOOT_GAP;
      drawCentered(page, line.text, y, line.font, FOOT_SIZE, MUTED);
    });
    drawCopyright(page, FOOT_BOTTOM);
  }

  return doc.save();
}
