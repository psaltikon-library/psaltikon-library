# notify-chant-submission

Emails **theorthodoxheritage@outlook.com** when a chant is submitted for approval.
It is triggered **server-side** by a Supabase Database Webhook on insert into
`public.chant_submissions` — so it fires reliably, independent of the browser.

## 1. Deploy the function

```bash
supabase functions deploy notify-chant-submission --no-verify-jwt
```

`--no-verify-jwt` makes it callable by the webhook (which has no user JWT). It is
protected instead by the `WEBHOOK_SECRET` header check below.

## 2. Set secrets

Supabase → Edge Functions → Secrets (or CLI):

```bash
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set FROM_EMAIL="Psaltikon Library <noreply@psaltikonlibrary.ca>"
supabase secrets set WEBHOOK_SECRET=<a-long-random-string>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — no
need to set them. `NOTIFY_EMAIL` is optional (defaults to the address above).

## 3. Create the Database Webhook

**Dashboard (recommended):** Database → Webhooks → **Create a new hook**
- Table: `public.chant_submissions`
- Events: **Insert** only
- Type: **Supabase Edge Functions** → `notify-chant-submission`
- HTTP Headers → add `x-webhook-secret` = the same value you set for `WEBHOOK_SECRET`
- Save.

**SQL alternative** (run in the SQL Editor; fill in the two placeholders):

```sql
create trigger on_chant_submission_created
  after insert on public.chant_submissions
  for each row execute function supabase_functions.http_request(
    'https://<PROJECT_REF>.functions.supabase.co/notify-chant-submission',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}',
    '{}',
    '5000'
  );
```

## 4. Test

Submit a chant on the live site, then check:
- Supabase → Edge Functions → **notify-chant-submission → Logs** (a `200`)
- Resend → **Emails** (delivery status)
- The Outlook inbox (including **Junk** — new sending domains often land there first)

To send by hand without a real submission:

```bash
curl -i -X POST https://<PROJECT_REF>.functions.supabase.co/notify-chant-submission \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <WEBHOOK_SECRET>" \
  -d '{"type":"INSERT","record":{"title":"Test chant","pdf_paths":["a.pdf"],"tone":"Tone 1"}}'
```
