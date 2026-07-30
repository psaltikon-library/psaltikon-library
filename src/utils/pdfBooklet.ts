import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { supabase } from '../lib/supabase';
import { Chant } from '../types';

const BURGUNDY = rgb(0.545, 0.149, 0.208); // #8B2635
const GOLD = rgb(0.788, 0.635, 0.153); // #C9A227
const INK = rgb(0.176, 0.165, 0.149); // #2D2A26
const MUTED = rgb(0.36, 0.34, 0.31);

/**
 * Resolve a chant's stored pdfPath to a fetchable URL. Mirrors ChantDetailPage:
 * absolute URLs pass through, "/"-prefixed paths come from public/, and bare
 * paths are served from the Supabase "chant-pdfs" storage bucket.
 */
export function resolveChantPdfUrl(chant: Chant): string {
  const anyChant = chant as unknown as Record<string, unknown>;
  const raw =
    anyChant.pdfPath ?? anyChant.pdf_path ?? anyChant.pdfUrl ?? anyChant.pdf ?? '';
  const path = typeof raw === 'string' ? raw.trim() : '';
  if (!path) return '';

  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
  }
  if (path.toLowerCase().includes('.pdf')) {
    const { data } = supabase.storage.from('chant-pdfs').getPublicUrl(path);
    return data?.publicUrl || '';
  }
  return '';
}

// pdf-lib's standard fonts are WinAnsi-only, so strip anything they can't encode
// (e.g. Greek titles) before drawing cover text — the chant PDFs keep their notation.
function winAnsiSafe(text: string): string {
  return (text || '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
}

function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  let out = text;
  while (out.length > 1 && font.widthOfTextAtSize(out, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return out.length < text.length ? `${out.trimEnd()}…` : out;
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface BookletPdfResult {
  bytes: Uint8Array;
  included: number;
  skipped: string[];
}

/**
 * Build a single PDF: a generated cover page (title, author, date, table of
 * contents) followed by every chant's PDF pages concatenated in order.
 * Chants whose PDF is missing or unreachable are skipped and reported.
 */
export async function buildBookletPdf(
  title: string,
  authorName: string,
  chants: Chant[]
): Promise<BookletPdfResult> {
  const doc = await PDFDocument.create();
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  // ── Cover page (A4) ──
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 64;
  const contentWidth = width - margin * 2;

  // '†' is WinAnsi-encodable (unlike ☩/☦), so the standard font can render it.
  const cross = '†';
  const crossW = serifBold.widthOfTextAtSize(cross, 30);
  page.drawText(cross, { x: (width - crossW) / 2, y: height - 120, size: 30, font: serifBold, color: GOLD });

  const safeTitle = winAnsiSafe(title) || 'Untitled Booklet';
  const titleLines = wrapLines(safeTitle, serifBold, 30, contentWidth);
  let y = height - 190;
  for (const line of titleLines) {
    const w = serifBold.widthOfTextAtSize(line, 30);
    page.drawText(line, { x: (width - w) / 2, y, size: 30, font: serifBold, color: INK });
    y -= 38;
  }

  // Gold rule under the title
  page.drawRectangle({ x: width / 2 - 60, y: y - 4, width: 120, height: 1.5, color: GOLD });
  y -= 40;

  const byline = winAnsiSafe(`Compiled by ${authorName || 'Anonymous'}`);
  const bylineW = serifItalic.widthOfTextAtSize(byline, 14);
  page.drawText(byline, { x: (width - bylineW) / 2, y, size: 14, font: serifItalic, color: MUTED });
  y -= 22;

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateW = serif.widthOfTextAtSize(dateStr, 11);
  page.drawText(dateStr, { x: (width - dateW) / 2, y, size: 11, font: serif, color: MUTED });
  y -= 50;

  page.drawText('CONTENTS', { x: margin, y, size: 11, font: serifBold, color: BURGUNDY });
  y -= 24;

  chants.forEach((chant, i) => {
    if (y < margin + 20) return; // don't overflow the cover; extra items simply aren't listed
    const num = `${i + 1}.`;
    page.drawText(num, { x: margin, y, size: 12, font: serifBold, color: BURGUNDY });
    const label = winAnsiSafe(chant.title) || 'Untitled chant';
    const labelText = truncateToWidth(label, serif, 12, contentWidth - 150);
    page.drawText(labelText, { x: margin + 26, y, size: 12, font: serif, color: INK });
    const meta = winAnsiSafe([chant.tone, chant.language].filter(Boolean).join(' · '));
    if (meta) {
      const metaW = serifItalic.widthOfTextAtSize(meta, 10);
      page.drawText(meta, { x: width - margin - metaW, y: y + 1, size: 10, font: serifItalic, color: MUTED });
    }
    y -= 20;
  });

  // ── Append each chant's PDF pages ──
  const skipped: string[] = [];
  let included = 0;

  for (const chant of chants) {
    const url = resolveChantPdfUrl(chant);
    if (!url) {
      skipped.push(chant.title);
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = await res.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await doc.copyPages(src, src.getPageIndices());
      pages.forEach((p) => doc.addPage(p));
      included += 1;
    } catch {
      skipped.push(chant.title);
    }
  }

  const bytes = await doc.save();
  return { bytes, included, skipped };
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
