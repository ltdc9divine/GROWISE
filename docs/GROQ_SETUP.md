# Growise AI Assistant — Groq setup

The chatbot and Budget Planner call Groq's Chat Completions REST API through
the `growise-ai-assistant` Supabase Edge Function. The API key must never be
added to frontend files, browser storage, or Git.

## Local key and model

1. Copy `supabase/functions/.env.example` to `supabase/functions/.env`.
2. Set `GROQ_API_KEY` to a key from the Groq Console. Do not send the key in
   chat, add it to source files, or commit the `.env` file.
3. Set `GROQ_MODEL` to a model available to your account. The default is
   `openai/gpt-oss-20b`. Check `GET https://api.groq.com/openai/v1/models`
   using the key before changing the model.
4. The configured account listed `openai/gpt-oss-20b`. A real Vietnamese chat
   and a complete Budget Planner request using a synthetic 1,000,000 VND
   budget both succeeded against Groq through the local Edge Function core;
   the allocation and weekly action totals each equaled 1,000,000 VND. This
   verifies the current model's JSON mode and response schema. It does not
   verify a deployed Supabase Function or browser-to-function integration.

The local `.env` is ignored by Git. To run locally with Supabase CLI:

```powershell
supabase start
supabase functions serve growise-ai-assistant --env-file supabase/functions/.env
```

For browser testing, temporarily point `js/supabase-config.js` at the local
Supabase URL and publishable key, and use an allowed localhost origin. Restore
the tracked frontend config before finishing. Opening `index.html` as a
`file://` URL is not supported by the Edge Function origin allowlist.

## Request behavior

The Edge Function calls `POST https://api.groq.com/openai/v1/chat/completions`
with `Authorization: Bearer GROQ_API_KEY`. Chat messages and history are
validated and converted to OpenAI-compatible `user`/`assistant` roles. The
Growise system instructions are retained. The API key is not returned to the
browser.

The Budget Planner sends data only when the user presses Generate. Groq is
asked for a JSON object; the server validates every required field and
percentage, calculates VND amounts itself, and rejects malformed output.
Changing form inputs invalidates a prior AI result. The basic client-side
calculation remains available if Groq fails. Sharing a plan to chat only
prefills a draft; it is sent only after the user presses Send.

Consultation, feedback, authentication, and student records are not included
in AI requests. Chat history remains in browser `sessionStorage`; no AI output
is written to the database.

The public function has a best-effort per-runtime-isolate rate limit (five
requests per minute per IP), input size limits, an upstream timeout, and
friendly handling for authentication, invalid request/model, quota, timeout,
network, and provider errors. Isolate-local limits are not global; use a shared
gateway/WAF limit and usage budget before public launch. The function is
configured without JWT verification so visitors can chat, so CORS is not user
authentication.

## Staging and deployment

Do not configure or deploy this function to Production for testing. Before
online testing, provision an approved non-Production Supabase project, set its
`GROQ_API_KEY`, `GROQ_MODEL`, and allowed origins, deploy the Edge Function to
that project, and configure the Vercel Preview frontend with only that
staging project's URL and publishable key. Never put `GROQ_API_KEY` in Vercel
environment variables.

```powershell
supabase secrets set --env-file supabase/functions/.env --project-ref <STAGING_PROJECT_REF>
supabase secrets set GROWISE_ALLOWED_ORIGINS=https://<STAGING_SITE_ORIGIN> --project-ref <STAGING_PROJECT_REF>
supabase functions deploy growise-ai-assistant --project-ref <STAGING_PROJECT_REF>
```

Do not run these commands against Production without separate explicit
approval. No database changes are required.

## Verification

Unit tests mock Groq and cover chat, multi-turn history, validation, JSON
schema enforcement, exact allocation math, quota, authentication, unavailable
models, malformed JSON, and timeout. The live checks above exercised the
actual local core against Groq; they do not prove a deployed Supabase Function
or browser-to-function integration.
