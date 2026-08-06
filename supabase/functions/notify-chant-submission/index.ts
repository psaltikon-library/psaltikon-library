// Supabase Edge Function: notify-chant-submission
// Emails the moderator when a chant is submitted for approval.
//
// Deploy:
//   supabase functions deploy notify-chant-submission
// Required secrets (Supabase → Project Settings → Edge Functions → Secrets):
//   RESEND_API_KEY   — API key from https://resend.com
//   FROM_EMAIL       — a verified Resend sender, e.g. "Psaltikon Library <noreply@psaltikonlibrary.ca>"
//                      (falls back to Resend's onboarding@resend.dev for quick testing)
// Optional:
//   NOTIFY_EMAIL     — recipient (defaults to theorthodoxheritage@outlook.com)
//
// The client invokes it with supabase.functions.invoke('notify-chant-submission', { body }).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') ?? 'theorthodoxheritage@outlook.com';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Psaltikon Library <onboarding@resend.dev>';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured.' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? 'Untitled chant').slice(0, 200);
    const submittedBy = String(body.submittedBy ?? 'a user').slice(0, 200);
    const pdfCount = Number(body.pdfCount ?? 0);
    const details: string[] = [
      body.tone && `Tone: ${body.tone}`,
      body.feast && `Feast: ${body.feast}`,
      body.service && `Service: ${body.service}`,
      body.part && `Part: ${body.part}`,
      body.language && `Language: ${body.language}`,
    ].filter(Boolean) as string[];

    const html = `
      <div style="font-family: Georgia, serif; color: #2D2A26; max-width: 560px;">
        <h2 style="color:#8B2635; margin-bottom: 4px;">New chant submitted for approval</h2>
        <p style="color:#5C574F;">A chant is awaiting review in the Psaltikon Library admin dashboard.</p>
        <table style="border-collapse: collapse; margin-top: 12px;">
          <tr><td style="padding:4px 12px 4px 0; color:#8A847A;">Title</td><td style="padding:4px 0;"><strong>${escapeHtml(title)}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0; color:#8A847A;">Submitted by</td><td style="padding:4px 0;">${escapeHtml(submittedBy)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0; color:#8A847A;">PDFs</td><td style="padding:4px 0;">${pdfCount}</td></tr>
          ${details.map((d) => `<tr><td colspan="2" style="padding:4px 0; color:#5C574F;">${escapeHtml(d)}</td></tr>`).join('')}
        </table>
        <p style="margin-top:16px; color:#5C574F;">Open the admin dashboard to approve or reject it.</p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        subject: `New chant submitted for approval: ${title}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Email provider error: ${errText}` }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
