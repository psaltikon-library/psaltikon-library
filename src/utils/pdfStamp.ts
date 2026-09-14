import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, Color } from 'pdf-lib';
import { Chant } from '../types';

const GOLD = rgb(0.788, 0.635, 0.153); // #C9A227
const INK = rgb(0.176, 0.165, 0.149); // #2D2A26
const MUTED = rgb(0.42, 0.4, 0.36);

const CONTACT_EMAIL = 'theorthodoxheritage@outlook.com';

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

/**
 * Top-of-page line. Uses the chant's `pdf_header` override when set, otherwise
 * derives "Book/Service - Title" (e.g. "Psalter - Psalm 83").
 */
export function headerLine(chant: Chant): string {
  const override = (chant.pdf_header || '').trim();
  if (override) return winAnsiSafe(override);
  const book = (chant.book || chant.service || '').trim();
  const title = (chant.title || '').trim();
  return winAnsiSafe(book && title ? `${book} - ${title}` : title || book);
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
  const copyright = `© ${new Date().getFullYear()} The Orthodox Heritage · ${CONTACT_EMAIL}`;

  // Footer lines, top to bottom: source credit, optional phonetics credit, then
  // the copyright line. Blank ones are dropped so the block collapses cleanly.
  const footerLines = [
    { text: composerCredit(chant), font: italic },
    { text: winAnsiSafe(chant.pdf_phonetics || ''), font: italic },
    { text: copyright, font },
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

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();

    // Header — title line with a thin gold rule beneath it.
    if (header) {
      drawCentered(page, header, height - 24, bold, HEADER_SIZE, INK);
      page.drawRectangle({
        x: MARGIN,
        y: height - 31,
        width: width - MARGIN * 2,
        height: 0.6,
        color: GOLD,
        opacity: 0.7,
      });
    }

    // Footer — a gold rule above the stacked credit/phonetics/copyright lines.
    const n = footerLines.length;
    const topBaseline = FOOT_BOTTOM + (n - 1) * FOOT_GAP;
    page.drawRectangle({
      x: MARGIN,
      y: topBaseline + 8,
      width: width - MARGIN * 2,
      height: 0.6,
      color: GOLD,
      opacity: 0.7,
    });
    footerLines.forEach((line, i) => {
      const y = FOOT_BOTTOM + (n - 1 - i) * FOOT_GAP;
      drawCentered(page, line.text, y, line.font, FOOT_SIZE, MUTED);
    });
  }

  return doc.save();
}
