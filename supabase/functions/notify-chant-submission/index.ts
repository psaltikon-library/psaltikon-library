// Supabase Edge Function: notify-chant-submission
// Emails the moderator when a chant is submitted for approval.
//
// Triggered SERVER-SIDE by a Supabase Database Webhook on INSERT into
// public.chant_submissions (Database → Webhooks). This is more reliable than a
// browser call: it fires even if the user closes the tab right after submitting.
//
// Deploy:
//   supabase functions deploy notify-chant-submission --no-verify-jwt
//   (the webhook is authenticated by the shared WEBHOOK_SECRET header instead of a JWT)
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY   — API key from https://resend.com                 (required)
//   FROM_EMAIL       — verified Resend sender, e.g.
//                      "Psaltikon Library <noreply@psaltikonlibrary.ca>" (required for real delivery)
//   WEBHOOK_SECRET   — any long random string; the webhook must send it
//                      as the "x-webhook-secret" header                 (recommended)
//   NOTIFY_EMAIL     — recipient (defaults to theorthodoxheritage@outlook.com)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically and are
// used only to look up the submitter's display name.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') ?? 'theorthodoxheritage@outlook.com';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Psaltikon Library <onboarding@resend.dev>';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );

async function lookupSubmitterName(userId: string | undefined): Promise<string> {
  if (!userId || !SUPABASE_URL || !SERVICE_ROLE) return 'A user';
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=username,first_name,last_name`,
      { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } }
    );
    const rows = await res.json();
    const p = Array.isArray(rows) ? rows[0] : null;
    if (p?.username) return p.username;
    if (p?.first_name) return [p.first_name, p.last_name].filter(Boolean).join(' ');
  } catch {
    /* fall through */
  }
  return 'A user';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Authenticate the caller with the shared secret (when configured).
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return json({ error: 'RESEND_API_KEY is not configured.' }, 500);

  const payload = await req.json().catch(() => ({} as Record<string, unknown>));

  // Database Webhook payload is { type, table, record, old_record }. Also accept
  // a flat body so the function can be tested by hand.
  const type = (payload as any).type as string | undefined;
  if (type && type !== 'INSERT') {
    return json({ ok: true, skipped: `ignored ${type}` });
  }
  const record = ((payload as any).record ?? payload) as Record<string, any>;

  const title = String(record.title ?? 'Untitled chant').slice(0, 200);
  const pdfCount = Array.isArray(record.pdf_paths)
    ? record.pdf_paths.length
    : Number(record.pdfCount ?? 0);
  const submittedBy =
    record.submittedBy ?? (await lookupSubmitterName(record.submitted_by));

  const details = [
    record.tone && `Tone: ${record.tone}`,
    record.feast && `Feast: ${record.feast}`,
    record.service && `Service: ${record.service}`,
    record.part && `Part: ${record.part}`,
    record.language && `Language: ${record.language}`,
  ].filter(Boolean) as string[];

  const html = `
    <div style="font-family: Georgia, serif; color: #2D2A26; max-width: 560px;">
      <h2 style="color:#8B2635; margin-bottom: 4px;">New chant submitted for approval</h2>
      <p style="color:#5C574F;">A chant is awaiting review in the Psaltikon Library admin dashboard.</p>
      <table style="border-collapse: collapse; margin-top: 12px;">
        <tr><td style="padding:4px 12px 4px 0; color:#8A847A;">Title</td><td style="padding:4px 0;"><strong>${escapeHtml(title)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#8A847A;">Submitted by</td><td style="padding:4px 0;">${escapeHtml(String(submittedBy))}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#8A847A;">PDFs</td><td style="padding:4px 0;">${pdfCount}</td></tr>
        ${details.map((d) => `<tr><td colspan="2" style="padding:4px 0; color:#5C574F;">${escapeHtml(d)}</td></tr>`).join('')}
      </table>
      <p style="margin-top:16px; color:#5C574F;">Open the admin dashboard to approve or reject it.</p>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      subject: `New chant submitted for approval: ${title}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return json({ error: `Email provider error: ${errText}` }, 502);
  }

  return json({ ok: true });
});
