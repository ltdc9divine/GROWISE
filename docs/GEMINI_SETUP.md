# Growise AI Assistant setup

The assistant calls the Gemini `generateContent` REST API only from the
`growise-ai-assistant` Supabase Edge Function. The Gemini API key must never be
added to frontend files, browser storage, or Git.

## Local key and model

1. Copy `supabase/functions/.env.example` to `supabase/functions/.env`.
2. Replace `GEMINI_API_KEY` with your key from Google AI Studio. Do not send the
   key in chat, add it to source files, or commit the `.env` file.
3. `GEMINI_MODEL` defaults to `gemini-3.8-flash`. The function calls that model
   directly. If the key cannot use it, the function asks the Gemini Models API
   for models supporting `generateContent` and returns their names without
   exposing the key. Set `GEMINI_MODEL` to one of those names and try again.

The local `.env` is ignored by Git. To run locally with Supabase CLI:

```powershell
supabase start
supabase functions serve growise-ai-assistant --env-file supabase/functions/.env
```

For the browser to call the local function, temporarily point
`js/supabase-config.js` at the local Supabase URL and its local publishable key,
then restore the tracked project values before finishing. Serve the website
from an allowed local origin, for example:

```powershell
python -m http.server 8765
```

Opening the HTML as a `file://` URL is not supported by the function's origin
allowlist.

## Staging setup

Use the staging Supabase project reference and staging website origin only.
Configure the staging website build's `js/supabase-config.js` with that
staging project's URL and publishable key; do not point the staging site at
Production.
First configure `GROWISE_ALLOWED_ORIGINS` with the exact staging origin plus any
local development origins needed. Then upload the Edge Function secrets and
deploy the function to staging:

```powershell
supabase secrets set --env-file supabase/functions/.env --project-ref <STAGING_PROJECT_REF>
supabase secrets set GROWISE_ALLOWED_ORIGINS=https://<STAGING_SITE_ORIGIN> --project-ref <STAGING_PROJECT_REF>
supabase functions deploy growise-ai-assistant --project-ref <STAGING_PROJECT_REF>
```

Do not run these commands against Production without explicit approval. The
function is configured with `verify_jwt = false` because visitors can chat
without signing in. The CORS origin allowlist is a browser access control, not
user authentication; the function also validates requests and rate-limits by
the gateway-provided client IP.

The rate limit is a best-effort per-runtime-isolate limit (five requests per
minute per IP) and does not use a database. Isolates can scale independently,
so staging/production should also enforce a shared gateway or WAF rate limit
and usage budget before public launch. No database changes are required.

The Edge Function uses the Gemini 3 `MINIMAL` thinking level, allows 20 seconds
for generation (then up to 10 seconds to list supported alternatives), and
caps answers at 700 output tokens so reasoning does not crowd out the answer.

## Data sent to Gemini

Only the messages in the chat conversation are sent. Conversation history is
kept in browser `sessionStorage` and is not written to Supabase. Consultation,
feedback, authentication, and student records are not read or sent. The Budget
Planner has an explicit “Ask AI to review this plan” action that drafts a
message containing the selected industry, audience, budget, goal, channels,
allocation, metric, and priorities; it is sent only after the user presses
Send. Startup name and product/service fields are excluded.

## Validation status

Mock tests cover request validation, errors, timeouts, model discovery, and rate
limits. The local key's Models API returned `gemini-3.8-flash` as supporting
`generateContent`, but a real generation request reported temporary capacity
unavailability. A real request using the same API key succeeded with
`gemini-3.5-flash`. Confirm the configured model before deploying the frontend.
