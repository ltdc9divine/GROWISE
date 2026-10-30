# Supabase Authentication Setup

## Current status

The owner reports that the Supabase schema and three Edge Functions were previously applied/deployed. This repository review has not independently connected to Supabase or verified that live state. The username-format migration below has **not** been run. The supplied project URL and publishable key are in [`../js/supabase-config.js`](../js/supabase-config.js); they are public browser configuration, not proof of connectivity.

All seven website routes remain public. Authentication protects account operations and the administrator's student-review data; it does not gate the existing pages, Consultation, or Feedback.

## Decisions already confirmed

- Students may self-register using email/password and must confirm their email.
- Student usernames use `name-mssv`, for example `dat-231283h1`. The submitted name portion is normalized to lowercase ASCII letters (Vietnamese diacritics are removed and `đ` becomes `d`); the MSSV must contain only Latin letters and digits and is lowercased. Exactly one hyphen separates the two non-empty parts. Usernames are unique without case sensitivity. `admin` is reserved for the administrator and cannot be registered as a student.
- Email confirmation proves mailbox access, not HUFLIT identity. New profiles remain `pending` until an administrator manually verifies them.
- Password recovery uses email. Sessions persist until sign-out.
- Admin status changes are manual. An admin must change the initial temporary password before using review tools.
- Consultation and Feedback remain public, client-only demonstrations and are not saved to Supabase.
- Passwords must contain at least 8 characters in the frontend and password-change function. Configure Supabase Auth to enforce the same minimum; its hosted setting must be checked separately.

## Dashboard configuration

1. Confirm the target Supabase project and inspect it for existing tables, functions, or triggers with the same names before applying this proposal.
2. In **Authentication → Sign In / Providers → Email**, enable email/password and email confirmation. Configure the provider's password policy intentionally; do not weaken it to permit `admin/admin`. Review the project's Auth rate limits for password sign-in and email delivery. Username login ultimately uses Supabase Auth's password sign-in endpoint, so its hosted rate limiting is the control here; the Edge Function does not use a process-local limiter.
3. In **Authentication → URL Configuration**, set the Site URL to `https://growise-five.vercel.app` and add exact redirect URLs for production and the development origins actually used (for example `http://localhost:5500/**` and `http://127.0.0.1:5500/**`). Do not use a broad wildcard for production.
4. The owner reports the existing schema is already applied. Do **not** rerun [`../supabase/schema.sql`](../supabase/schema.sql) against that database. For an existing installation, first take a database backup and review the username migration steps below; never reset or replace live data.
5. In **Project Settings → API**, confirm the URL and publishable key. These are public browser configuration; they are already placed in [`../js/supabase-config.js`](../js/supabase-config.js). Never place the service-role key in the website or Git.
6. Install/use the Supabase CLI in an approved development environment, authenticate, and link it to the verified project. Set Edge Function secrets without putting secret values in source or documentation:

   ```powershell
   supabase secrets set SUPABASE_URL=<project-url> SUPABASE_ANON_KEY=<publishable-or-anon-key> SUPABASE_SERVICE_ROLE_KEY=<service-role-secret> GROWISE_ALLOWED_ORIGINS=https://growise-five.vercel.app,http://localhost:5500,http://127.0.0.1:5500
   ```

   `SUPABASE_SERVICE_ROLE_KEY` must only exist in the trusted Edge Function secret store. The browser uses only the publishable key. Add any additional development origin explicitly to `GROWISE_ALLOWED_ORIGINS` and Supabase's redirect allowlist.
7. Deploy the three functions:

   ```powershell
   supabase functions deploy username-login
   supabase functions deploy admin-student-review
   supabase functions deploy change-password
   ```

   [`../supabase/config.toml`](../supabase/config.toml) disables gateway JWT verification only for `username-login`, because that endpoint receives credentials and performs its own Auth sign-in. The other functions require a JWT at the gateway and verify the caller again in the function.
8. Configure Supabase email templates and deliverability as required. Confirm links return to the exact website origin. Do not disable email confirmation to make registration easier.

## First administrator provisioning

The app contains no administrator credentials. Create a dedicated Auth user in the Supabase Dashboard with a confirmed email and no `username` user-metadata field. Use the requested initial `admin` / `admin` only if Supabase accepts that password under the chosen development policy; otherwise assign a stronger temporary password through the Dashboard. Never put either password in code, SQL, chat, or Git.

After confirming the Auth user, obtain its UUID from the Dashboard (or inspect `auth.users` in SQL Editor), then call the one-time bootstrap function from the privileged SQL Editor:

```sql
select public.growise_bootstrap_admin('<confirmed-auth-user-uuid>');
```

The function refuses to run if an admin/profile is already provisioned or the Auth email is unconfirmed. It creates the `admin` profile with `must_change_password = true`. Sign in with username `admin`, change the temporary password from the account dialog, and only then use student-review tools. Do not expose service-role credentials to perform bootstrap from a browser.

## What the implementation does

- [`../js/supabase-auth.js`](../js/supabase-auth.js) uses the official Supabase JS v2 CDN client for student registration, username-based sign-in through the Edge Function, session restoration, sign-out, email confirmation, recovery, account email/password changes, and localized VI/EN messages.
- Registration sends only a canonical `name-mssv` username in Auth user metadata. A database trigger creates a `pending` profile. The trigger does not grant student access.
- `username-login` maps the canonical username to the Auth email using the service role on the server, then validates the password through Supabase Auth using the publishable/anon key, where Supabase Auth's configured rate limits apply. Client responses do not disclose whether a username exists. No in-memory Edge Function limiter is used.
- `admin-student-review` verifies the JWT, checks the trusted `admin` role and the forced-password-change flag, lists only email-confirmed pending profiles, and calls the service-only status function. Approval creates the trusted `student` role; rejection leaves the account without that role.
- `change-password` verifies the caller's JWT, updates the password through the Admin API, and clears the server-managed forced-change flag.
- `public.growise_profiles` is self-readable only; role data is in the non-exposed `growise_private` schema. No role supplied by the browser or local storage is trusted.
- The site does not store or log plaintext passwords. Supabase persists the Auth session as configured by its browser client; no Consultation or Feedback submission is persisted.

The exact student-email domain policy has not been specified. Email confirmation alone is not HUFLIT verification; the admin review process is the only implemented verification path. The pages themselves are public by the owner's decision, so there is no protected-page route to test.

## Verification checklist

Do not report authentication as live until all of these are tested against the configured project:

- Inspect the owner-reported applied schema, RLS, trigger, grants, and role functions in the Dashboard; separately back up and review the username migration before any manual application.
- Register with valid and invalid `name-mssv` values; confirm registration creates a pending profile but no `student` role.
- Confirm email; sign in using lowercase and mixed-case username. Invalid credentials should produce one generic error.
- Verify persisted session after reload and sign-out; ensure Consultation/Feedback remain public.
- Test recovery, confirmed email update, password policy failures, and temporary admin password change.
- Ensure pending/rejected students cannot invoke admin endpoints; verified students still cannot.
- Ensure only an admin who has changed the temporary password can list/review students. Test direct Edge Function calls, not only hidden UI controls.
- Confirm the admin status transition adds/removes the trusted student role and that profile writes remain denied to browser roles.
- Test allowed and disallowed CORS origins, email redirect URLs, and the deployed Vercel page.
- Run `node --check` on every changed JavaScript file and `git diff --check`; parse/type-check Edge Functions with the supported Deno/Supabase tooling before deployment.

Live registration, login, recovery, session restoration, role enforcement, and RLS remain **unverified in this repository session**, even though the owner reports that the schema and functions were previously deployed.

## Existing-database username migration

The schema and trigger in `schema.sql` describe the new format for a fresh installation. An existing database needs the separate, one-time migration [`../supabase/migrations/20261031_username_hyphen_format.sql`](../supabase/migrations/20261031_username_hyphen_format.sql). Do not apply it until its effects have been reviewed.

1. Verify the project reference in the Supabase Dashboard and confirm that the deployed Edge Functions use the new hyphen format before enabling registrations with the new frontend.
2. Take and verify a restorable database backup. In the SQL Editor, run a read-only preflight to inspect legacy mappings and collisions:

   ```sql
   with mappings as (
     select id, username as old_username,
       case when username ~ '^[a-z]+\.[a-z0-9]+$'
         then replace(username, '.', '-') else username end as new_username
     from public.growise_profiles
   )
   select new_username, count(*) as account_count,
          array_agg(old_username order by old_username) as usernames
   from mappings
   group by new_username
   having count(*) > 1;
   ```

   The result must be empty. The migration also checks formats and conflicts and aborts its transaction if any precondition fails. Do not manually rename or delete accounts to force it through; resolve a collision with the project owner and a per-account identity plan first.
3. Review the entire migration and confirm the private schema/table and constraint names match the live database. Apply only that migration in the verified project's Supabase SQL Editor, in one transaction. It keeps an old-to-new username map in `growise_private.username_migration_20261031`, updates legacy names in profiles and their Auth user metadata (preserving other metadata), and does not delete profiles, Auth users, roles, or credentials.
4. Verify row counts, mapped usernames, the unique index, trigger function, and new check constraint after applying. Keep the backup and migration mapping according to the project's retention policy.
5. If any SQL statement errors, stop. The transaction should roll back; inspect the exact live schema and get a reviewed adjustment rather than rerunning the whole schema or applying ad hoc edits.

Do not run this migration automatically from deployment or against production without the owner explicitly approving the maintenance window and backup.
