import { supabase } from '../lib/supabase';

export type ChantPdfRow = {
  id: string;
  chant_id: string;
  pdf_path: string;
  label: string | null;
  sort_order: number;
};

export const labelFromFileName = (fileName: string) =>
  fileName.replace(/\.pdf$/i, '').trim() || 'PDF';

export async function loadChantPdfs(chantId: string): Promise<ChantPdfRow[]> {
  const { data, error } = await supabase
    .from('chant_pdfs')
    .select('id, chant_id, pdf_path, label, sort_order')
    .eq('chant_id', chantId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to load chant PDFs.');
  }

  return (data || []) as ChantPdfRow[];
}

export async function addChantPdfs(
  rows: Array<Pick<ChantPdfRow, 'chant_id' | 'pdf_path' | 'label' | 'sort_order'>>
): Promise<void> {
  if (!rows.length) return;

  const { error } = await supabase.from('chant_pdfs').insert(rows);

  if (error) {
    throw new Error(error.message || 'Failed to register chant PDFs.');
  }
}

export async function updateChantPdfLabels(
  rows: Array<{ id: string; label: string }>
): Promise<void> {
  for (const row of rows) {
    const { error } = await supabase
      .from('chant_pdfs')
      .update({ label: row.label.trim() || null })
      .eq('id', row.id);

    if (error) {
      throw new Error(error.message || 'Failed to rename a PDF.');
    }
  }
}

export async function deleteChantPdfs(ids: string[]): Promise<void> {
  if (!ids.length) return;

  const { error } = await supabase.from('chant_pdfs').delete().in('id', ids);

  if (error) {
    throw new Error(error.message || 'Failed to remove chant PDFs.');
  }
}
