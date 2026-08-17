import { supabase } from '../lib/supabase';
import { Chant } from '../types';
import { addChantPdfs, labelFromFileName } from './chantPdfs';

export interface ChantSubmissionInput {
  title: string;
  tone?: string;
  feast?: string;
  service?: string;
  part?: string;
  language?: string;
}

export interface ChantSubmission {
  id: string;
  submitted_by: string;
  title: string;
  tone: string | null;
  feast: string | null;
  service: string | null;
  part: string | null;
  language: string | null;
  pdf_paths: string[];
  pdf_labels: string[];
  status: 'pending' | 'approved' | 'rejected';
  approved_chant_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  submitterName?: string | null;
}

function buildSubmissionPdfPath(file: File, title: string): string {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const uniqueId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `submissions/${uniqueId}-${slug || 'untitled'}.${extension}`;
}

/**
 * Upload the PDFs and create a pending submission. The moderator email is sent
 * server-side by a Database Webhook on insert, not from here.
 */
export async function createChantSubmission(
  input: ChantSubmissionInput,
  files: File[]
): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to submit a chant.');
  }

  const title = input.title.trim();
  if (!title) throw new Error('Please enter a chant title.');
  if (files.length === 0) throw new Error('Please add at least one PDF.');

  const uploadedPaths: string[] = [];
  const labels: string[] = [];

  for (const file of files) {
    const path = buildSubmissionPdfPath(file, title);
    const { error: uploadError } = await supabase.storage
      .from('chant-pdfs')
      .upload(path, file, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      if (uploadedPaths.length) {
        await supabase.storage.from('chant-pdfs').remove(uploadedPaths);
      }
      throw new Error(uploadError.message || 'Failed to upload PDF.');
    }
    uploadedPaths.push(path);
    labels.push(labelFromFileName(file.name));
  }

  const { error: insertError } = await supabase.from('chant_submissions').insert({
    submitted_by: user.id,
    title,
    tone: input.tone || null,
    feast: input.feast || null,
    service: input.service || null,
    part: input.part || null,
    language: input.language || null,
    pdf_paths: uploadedPaths,
    pdf_labels: labels,
    status: 'pending',
  });

  if (insertError) {
    await supabase.storage.from('chant-pdfs').remove(uploadedPaths);
    throw new Error(
      `${insertError.message || 'Failed to submit chant.'} (Has the 20260806 chant submissions migration been run in Supabase?)`
    );
  }

  // The moderator email is sent server-side by a Postgres trigger on insert into
  // chant_submissions (see 20260807_chant_submission_email_trigger.sql), which
  // calls Resend directly via pg_net — reliable even if the browser closes.
}

// ── Admin side ───────────────────────────────────────────────────────────────

const DEV_TS = '2026-08-01T09:00:00.000Z';
function devPendingSubmissions(): ChantSubmission[] {
  return [
    {
      id: 'dev-submission-1',
      submitted_by: 'dev-user',
      title: 'Cherubic Hymn (Submitted)',
      tone: 'Tone 6',
      feast: 'Sunday',
      service: 'Divine Liturgy',
      part: 'Cherubic Hymn',
      language: 'English',
      pdf_paths: ['submissions/dev-sample.pdf'],
      pdf_labels: ['Cherubic Hymn'],
      status: 'pending',
      approved_chant_id: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: DEV_TS,
      submitterName: 'A parishioner',
    },
  ];
}

export async function listPendingSubmissions(): Promise<ChantSubmission[]> {
  const { data, error } = await supabase
    .from('chant_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return import.meta.env.DEV ? devPendingSubmissions() : [];
  }

  const submissions = (data || []) as ChantSubmission[];
  if (submissions.length === 0) return [];

  // Enrich with submitter display names (FK points at auth.users, so join manually).
  const ids = Array.from(new Set(submissions.map((s) => s.submitted_by)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name')
    .in('id', ids);

  const nameById = new Map<string, string>();
  (profiles || []).forEach((p: any) => {
    const name = p.username || [p.first_name, p.last_name].filter(Boolean).join(' ');
    if (name) nameById.set(p.id, name);
  });

  return submissions.map((s) => ({ ...s, submitterName: nameById.get(s.submitted_by) || 'A user' }));
}

/** Promote a submission into a real, approved chant + its PDFs. */
export async function approveSubmission(submission: ChantSubmission): Promise<Chant> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: chant, error: chantError } = await supabase
    .from('chants')
    .insert({
      title: submission.title,
      tone: submission.tone,
      feast: submission.feast,
      service: submission.service,
      part: submission.part,
      language: submission.language,
      pdf_path: submission.pdf_paths[0] || null,
      uploaded_by: submission.submitted_by,
      status: 'approved',
    })
    .select('*')
    .single();

  if (chantError || !chant) {
    throw new Error(chantError?.message || 'Failed to create the approved chant.');
  }

  if (submission.pdf_paths.length > 0) {
    try {
      await addChantPdfs(
        submission.pdf_paths.map((path, index) => ({
          chant_id: chant.id,
          pdf_path: path,
          label: submission.pdf_labels[index] || labelFromFileName(path.split('/').pop() || ''),
          sort_order: index,
        }))
      );
    } catch {
      /* chant + its primary PDF are saved; extra rows are non-fatal */
    }
  }

  const { error: updateError } = await supabase
    .from('chant_submissions')
    .update({
      status: 'approved',
      approved_chant_id: chant.id,
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission.id);

  if (updateError) throw new Error(updateError.message || 'Chant created, but marking the submission failed.');

  return chant as Chant;
}

export async function rejectSubmission(submission: ChantSubmission): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('chant_submissions')
    .update({
      status: 'rejected',
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission.id);

  if (error) throw new Error(error.message || 'Failed to reject submission.');

  // Best-effort cleanup of the uploaded files.
  if (submission.pdf_paths.length > 0) {
    await supabase.storage.from('chant-pdfs').remove(submission.pdf_paths).catch(() => {});
  }
}
