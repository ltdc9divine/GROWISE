# Supabase Authentication Setup

## Current status

Student profiles use `public.growise_users` and the `student-login` Edge Function in Supabase project `oqyibynbowpegjjaigoz` (Growise). Migration `20261031163000` is applied; the function is ACTIVE at version 2 with `verify_jwt=false`. Vercel Preview is READY at `https://growise-p9w5vow3d-ltdc9divine-5816s-projects.vercel.app`. Student access checks only name + username: it is not identity authentication, does not create Supabase Auth users/sessions/roles, and must not protect private data. The browser stores only a temporary UI session identity and revalidates it with the Edge Function on restore.

The previous `growise_demo_students` table and `student-demo-login` function remain in the project as legacy objects; neither is used by the current frontend. Two records remain in that legacy table and were not copied, updated, or deleted. The archived source is under `../supabase/archive/`. Do not drop legacy database objects until their dependencies and backup/rollback plan have been reviewed.

All seven website routes remain public. Authentication protects account operations and the administrator's student-review data; it does not gate the existing pages, Consultation, or Feedback.

## Decisions already confirmed

- Students enter full name and username; the first valid sign-in creates a row in `public.growise_users`. Existing usernames require a matching normalized full name. Sign-out removes only the browser's temporary UI session, not the database row.
- Student usernames are trimmed, lowercased, and validated as `^[a-z]+-[a-z0-9]+$`; Vietnamese diacritics are preserved in names and repeated whitespace is collapsed. The student ID shown in the student profile is the part after the hyphen.
- Student profiles are shared across localhost and Vercel through the same Supabase project. A name/username pair does not prove identity and must not protect personal, academic, or other private data.
- Student sign-in assigns no Supabase role and creates no Supabase session. Keep student-only protected data/features disabled until the school provides real authentication.
- Admin sign-in remains username/password and retains the trusted admin role and forced password-change checks. Sessions persist until sign-out.
- Admin users can continue managing Supabase student profiles through the admin-only Edge Function. Public Auth signups should remain disabled.
- Consultation and Feedback remain public, client-only demonstrations and are not saved to Supabase.
- Administrator passwords must contain at least 8 characters in the frontend and password-change function. Configure Supabase Auth to enforce the same minimum; its hosted setting must be checked separately.

## Dashboard configuration

1. Confirm the target Supabase project and inspect it for existing tables, functions, or triggers with the same names before applying this proposal. Take a verified restorable database backup.
2. In **Authentication → Sign In / Providers → Email**, keep Email enabled for administrator password sign-in/recovery, and disable public signups. Student sign-in does not use email or OTP.
3. In **Authentication → URL Configuration**, set the Site URL to `https://growise-five.vercel.app` and add exact redirect URLs for production and the development origins actually used (for example `http://localhost:5500/**` and `http://127.0.0.1:5500/**`). Do not use a broad wildcard for production.
4. Do **not** rerun [`../supabase/schema.sql`](../supabase/schema.sql) against an existing database. The additive student migration is [`../supabase/migrations/20261031163000_create_growise_users.sql`](../supabase/migrations/20261031163000_create_growise_users.sql); it creates `growise_users`, a private timestamp trigger, and a canonical rate-limit RPC wrapper, without changing admin profiles/roles or deleting legacy records. It preflights that the target table is absent and legacy rate-limit objects exist. This version is applied. The prior `20261031` username-format and `20261101` OTP migrations remain pending; do not run them as part of this flow.
5. In **Project Settings → API**, confirm the URL and publishable key. These are public browser configuration; they are already placed in [`../js/supabase-config.js`](../js/supabase-config.js). Never place the service-role key in the website or Git.
6. Install/use the Supabase CLI in an approved development environment, authenticate, and link it to the verified project. Set Edge Function secrets without putting secret values in source or documentation:

   ```powershell
   supabase secrets set SUPABASE_URL=<project-url> SUPABASE_ANON_KEY=<publishable-or-anon-key> SUPABASE_SERVICE_ROLE_KEY=<service-role-secret> GROWISE_ALLOWED_ORIGINS=https://growise-five.vercel.app,http://localhost:5500,http://127.0.0.1:5500,http://localhost:5173,http://127.0.0.1:5173,https://<exact-vercel-preview-origin>
   ```

   Set `GROWISE_ALLOWED_ORIGINS` to a comma-separated list of exact origins; when set, it replaces the defaults. Each new Preview hostname must be allowlisted before browser use. Do not add a wildcard. Include any other exact localhost origin used. `SUPABASE_SERVICE_ROLE_KEY` must only exist in the trusted Edge Function secret store. The browser uses only the publishable key. The student function requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; the existing admin functions may also require `SUPABASE_ANON_KEY`.
7. Deploy only the student endpoint for this flow:

   ```powershell
   supabase functions deploy student-login
   ```

   The frontend calls only `student-login` for student profiles. The older `student-demo-login` deployment remains active for compatibility with the current Production site, but this frontend does not call it. Its source and the OTP function source are archived and their config sections removed. No legacy function or migration was removed; the old username-format and OTP migrations remain pending.
8. Configure email delivery only as needed for administrator recovery. Student sign-in sends no email or OTP.

## First administrator provisioning

The app contains no administrator credentials. Create a dedicated Auth user in the Supabase Dashboard with a confirmed email, a strong temporary password, and no `username` user-metadata field. Never put the password in code, SQL, chat, or Git.

After confirming the Auth user, obtain its UUID from the Dashboard (or inspect `auth.users` in SQL Editor), then call the one-time bootstrap function from the privileged SQL Editor:

```sql
select public.growise_bootstrap_admin('<confirmed-auth-user-uuid>');
```

The function refuses to run if an admin/profile is already provisioned or the Auth email is unconfirmed. It creates the `admin` profile with `must_change_password = true`. Sign in with username `admin`, change the temporary password from the account dialog, and only then use student-review tools. Do not expose service-role credentials to perform bootstrap from a browser.

## What the implementation does

- [`../js/student-auth.js`](../js/student-auth.js) calls the shared `student-login` Edge Function and stores only a temporary UI session identity in browser `localStorage`; every restore is revalidated. Legacy session state is verified and migrated to the current session key.
- [`../js/supabase-auth.js`](../js/supabase-auth.js) keeps the existing administrator password login, session, password/email management, and admin-only student management. Student display contains only the database-returned full name and student ID.
- [`../supabase/functions/student-login/index.ts`](../supabase/functions/student-login/index.ts) validates and normalizes name/username, derives the student ID, stores/reuses `growise_users` through a server-side service-role client, handles unique-key races, and rate-limits new records. It creates no Auth user/session/role and does not use admin/profile APIs.
- [`../supabase/migrations/20261031163000_create_growise_users.sql`](../supabase/migrations/20261031163000_create_growise_users.sql) creates the RLS-protected canonical table with no `anon`/`authenticated` table privileges and a case-insensitive unique username index.
- [`../supabase/archive/`](../supabase/archive/) retains legacy OTP and demo Edge Function source; [`../supabase/migrations/20261031090700_student_demo_students.sql`](../supabase/migrations/20261031090700_student_demo_students.sql) remains in migration history because it was applied.
- [`../supabase/archive/functions/student-otp-login/index.ts`](../supabase/archive/functions/student-otp-login/index.ts) retains the legacy source and is not an active Supabase function.
- [`../supabase/functions/username-login/index.ts`](../supabase/functions/username-login/index.ts) is retained for the administrator only; it checks the trusted admin role and uses the existing password-based Auth verification. Students cannot use this endpoint to sign in.
- [`../supabase/functions/admin-student-review/index.ts`](../supabase/functions/admin-student-review/index.ts) remains limited to an authenticated admin who has changed the temporary password. It continues to manage the separate `growise_profiles` table.
- [`../supabase/functions/change-password/index.ts`](../supabase/functions/change-password/index.ts) remains for administrator password management.
- [`../supabase/migrations/20261101_student_otp_login.sql`](../supabase/migrations/20261101_student_otp_login.sql) remains as an unapplied historical migration. Do not apply it for this feature.
- `public.growise_profiles` remains self-readable only, and role data remains in the non-exposed `growise_private` schema. Browser-supplied names, usernames, IDs, or roles do not independently grant access.
- Full names and usernames are not authentication factors. This access flow must not expose private student data or trigger privileged operations. Existing website routes remain public.

## Verification checklist

Do not report authentication as live until all of these are tested against the configured project:

- Verify profile creation, matching-name reuse, mismatch rejection, invalid-username rejection, reload revalidation, and sign-out while keeping the database row. These endpoint/browser tests were run using synthetic test data against the configured project.
- Confirm student login calls only `student-login`, creates no Supabase Auth user/session or role, and cannot directly read/write `growise_users` with the publishable key. Direct REST read returned HTTP 401.
- Verify student account display contains only the returned full name and database student ID.
- Verify admin password sign-in, forced password change, provisioning, lock/reactivation, and management functions remain intact.
- Confirm direct calls to admin endpoints are denied to students and browser profile writes remain denied by RLS.
- Localhost login, reload revalidation, sign-out, and reuse of the same stored row were verified before the final frontend file rename. All configured local, Production, and Preview CORS origins returned 204 preflight; an unlisted origin returned 403. The Preview HTML was verified through authenticated Vercel CLI access; interactive browser testing remains blocked by Vercel deployment protection.
- Run `node --check` on every changed JavaScript file and `git diff --check`; parse/type-check Edge Functions with the supported Deno/Supabase tooling before deployment.

Frontend tests and localhost student login/reload were verified. The canonical Supabase function successfully created and reused a synthetic row and rejected mismatch/invalid inputs. Direct `growise_users` read by the publishable key returned HTTP 401; Preview HTML was served through authenticated Vercel CLI. Browser testing of Preview remains blocked by Vercel deployment protection. Full catalog introspection of legacy triggers/policies timed out due to a temporary-role database password error; no production objects were dropped. Admin end-to-end behavior remains **unverified**. Names and usernames do not provide identity verification.

## Existing-database username migration (legacy Supabase accounts only)

This migration changes only the legacy username format in `growise_profiles` and is unrelated to `growise_users`. It remains pending; do not apply it to enable student sign-in.

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
