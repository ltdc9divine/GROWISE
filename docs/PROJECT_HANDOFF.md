# GROWISE Project Handoff

**Repository:** `ltdc9divine/GROWISE`
**Branch inspected:** `main`
**Documentation date:** 2026-10-31
**Evidence labels:** “Verified” describes the checked-in source or a test actually run. “Proposed” and “Pending” are not implemented or confirmed.

## 1. Project overview

GROWISE is a static academic website prototype exploring marketing support for HUFLIT senior students who have startup ideas or early-stage student ventures. Its stated research topic is “Exploring Factors Affecting Start-up Success among HUFLIT Seniors: Developing a Marketing Support Website for Student Start-ups.”

- **Target users (verified):** HUFLIT seniors exploring entrepreneurship and student-led early-stage ventures.
- **Slogan/title (verified):** “Your Partner in Startup Growth”; the Vietnamese localization is “Đồng hành cùng startup tăng trưởng.”
- **Technology (verified):** Plain HTML, CSS, and browser JavaScript. No framework, package manifest, build step, backend, or installed runtime dependency is present. Google Fonts (Inter, Space Grotesk, DM Mono) are requested externally, with local system-font fallbacks.
- **Current product status (verified):** Static prototype. Consultation and feedback are not transmitted to a server. The planner is an illustrative client-side calculation, not financial advice or a forecast.
- **Not verified:** Any official HUFLIT operation or endorsement, user/account identity, real consultation availability, and production deployment target.

## 2. Seven current pages and routes

All pages are sections in [`index.html`](../index.html), selected by the hash routes below; this is not seven separate HTML documents.

| Route | Page | Current features |
|---|---|---|
| `#home` | Home | Marketing-support introduction, animated 3D particle orb, challenge/purpose content, “Why Growise?”, toolkit cards, and calls to the planner, services, About, and consultation. |
| `#about` | About Us | Project story and research topic, mission, vision, principles, intended audience, and a transparent team-information note. Verified member names and responsibilities have not been supplied. |
| `#services` | Services | Four proposed areas: marketing strategy consultation, marketing-plan development, budget optimization, and campaign-performance review. Descriptions qualify scope and avoid claiming proven outcomes; calls to action lead to Consultation or Planner. |
| `#planner` | Budget Planner | Seven inputs; client-side illustrative allocation, contextual priorities, a test-duration and metric suggestion, low-budget guidance, copy and TXT download. |
| `#resources` | Resources | Four filters (strategy, budgeting, content, measurement), six guide cards, article modal, language switcher, and a link from the modal to Planner. The required instructor reference for the categories was not found. |
| `#consultation` | Consultation | Nine form fields, validation, and an in-browser demo confirmation. No submission is sent and no appointment is booked. |
| `#feedback` | Feedback | Separate page with a feedback hero, seven required star-rating groups, three optional text areas, validation, and a one-time client-side thank-you state. Feedback is not saved or sent. |

## 3. Navigation and user journeys

- The top navigation contains the seven routes, a growth-planning CTA, VI/EN controls, and a collapsible mobile menu.
- `js/main.js` handles `data-page` clicks, activates the matching `.page`, updates the hash with `history.pushState`, handles browser back/forward, and scrolls to the top.
- The main intended journey is Home → Services → Budget Planner → Resources → Consultation. The relevant service, planner, resource, and consultation links are present.
- Feedback is also independently available through its own navigation item and `#feedback` route. Its “Back to consultation” links return to `#consultation`.
- Routes and views are currently public. A hash route or hidden navigation item is not an authorization boundary.
- **Browser verification:** All seven routes were navigated; no duplicate DOM IDs or broken in-page links were found in the checked markup. Consultation-to-Feedback is not an automatic submission flow in the current version.
- The current footer has the GROWISE brand, HUFLIT logo, one Sư Vạn Hạnh main-campus address, and footer navigation. The requested four-campus list and embedded Hóc Môn map are not present in the inspected source.

## 4. Vietnamese and English localization

[`js/translations.js`](../js/translations.js) contains the VI/EN message catalogs, localized resource-article content, and static-text lookup. It sets `document.documentElement.lang`, updates text/HTML and attributes (`placeholder`, `aria-label`, `alt`, `title`, and meta description), and dispatches `growise:localechange` so dynamic components can redraw.

- Vietnamese is the fallback locale; the selected locale is stored as `growise.locale` in localStorage. If storage is unavailable, the current page can still switch language.
- The HTML uses `data-i18n*` attributes for translated content. `js/budget-planner.js` redraws generated results on locale changes; `js/main.js` refreshes rating labels/errors and an open Resources article.
- **Verified in browser:** VI/EN changes updated the checked navigation, footer, Planner, consultation/feedback messages, star labels, and open article. Form values and selected feedback ratings remain in page memory while switching language.
- Feedback answers and consultation values are not written to localStorage by the current application; the locale preference is.

## 5. Budget Planner

### Inputs

Seven controls are in the Planner form:

1. Startup name.
2. Business industry (consumer product, food and beverage, services, education, fashion and beauty, technology/digital).
3. Product or service.
4. Target customer group.
5. Main marketing objective (awareness, engagement, leads/inquiries, sales).
6. Current marketing channels.
7. Monthly budget in VND, from 200,000 to 10,000,000 in 100,000 increments; default 1,000,000.

### Calculation and outputs

`js/budget-planner.js` allocates the selected amount across content/creative, paid promotion, customer research, and testing/reserve. The starting shares are 40/25/20/15. Industry rules may replace these: food 35/25/25/15; services or education 35/15/30/20; fashion 40/30/15/15. Objective rules then replace the shares for awareness (45/25/15/15), leads (30/25/25/20), or sales (30/30/20/20). Engagement has no separate override. The four displayed shares total 100%.

The page also generates up to five heuristic priorities from channel, audience, industry, and objective; a fixed 7–14-day first-test suggestion; an objective-based primary metric; and budget-band copy for amounts up to 500,000, up to 2,000,000, and above 2,000,000 VND. Copy and TXT download build a summary in the browser.

### Limitations

These are fixed heuristics, not research-derived recommendations or a prediction of outcomes. They do not model actual costs, margins, revenue, or campaign data. The interface itself warns users to validate assumptions before spending. The application does not send Planner inputs to a server.

## 6. Consultation and Feedback forms

### Consultation

The nine fields are full name, email, startup name, business industry, monthly marketing budget, preferred method, preferred date, preferred time, and current marketing challenges. Five are required: name, email, industry, method, and challenge. Validation checks required values, email syntax, and that a selected date is not before the browser's local current date. Valid submission displays a localized demo confirmation; invalid submission stays on the form. It does not send data, book an appointment, or preserve fields across a full reload.

### Feedback

The seven required rating groups are overall satisfaction, ease of use, usefulness, marketing services, budget-planning tool, resources/learning, and AI assistant. Each is a 1–5 star radio group with keyboard arrow/Home/End support. The three text questions (what the user liked, what to improve, and desired features) are optional. Missing ratings are listed and focused; a valid submission hides the form and reveals a thank-you message once. There is no API call or feedback persistence.

## 7. Theme, responsive behavior, animation, and UI constraints

[`css/style.css`](../css/style.css) defines a light palette: white (`#FFFFFF`), soft green-white (`#F7F9F5`), dark text (`#171A16`), lime (`#B9FF4A`), and deeper greens. Inter is the body font, Space Grotesk is used for display headings, and DM Mono for technical labels. The shared content width is 1240px.

Responsive rules are present at 1100, 900, 680, and 390 CSS pixels; the mobile navigation collapses, page heroes and layouts stack, and card/form grids adapt. The stylesheet includes `prefers-reduced-motion` rules. The body declares a 320px minimum width and hides horizontal overflow; this declaration alone should not be treated as proof that child content fits.

- `js/particle-orb.js` draws the Home particle sphere with multi-axis motion and pointer dragging. It resizes with the canvas and pauses when the canvas/tab is not visible.
- `js/subpage-orbits.js` provides five distinct canvas scenes for About, Services, Planner, Resources, and Consultation. It uses visibility/lifecycle handling and respects reduced-motion preference.
- Feedback uses its CSS speech-bubble/orbit hero; it is not a sixth subpage canvas.
- **Browser verification:** No horizontal overflow was found for any of the seven routes at 360, 390, 430, 768, 1024, or 1440 CSS pixels (42 route/viewport combinations). The canvas scenes were observed changing while visible and pausing when their page was hidden.
- Preserve the white/lime visual system, the Home orb lifecycle, existing hash navigation, and the independent feedback form when integrating future features.

## 8. JavaScript responsibilities

| File | Responsibility |
|---|---|
| [`js/translations.js`](../js/translations.js) | VI/EN catalogs, source-text translation, DOM attributes, locale persistence and change events, localized article data. |
| [`js/main.js`](../js/main.js) | Seven-route hash navigation, mobile navigation, Resources modal and filters, consultation validation/demo confirmation, feedback stars/validation/success, and toast messages. |
| [`js/budget-planner.js`](../js/budget-planner.js) | Planner allocations, recommendations, localized output, copy, and TXT download. |
| [`js/particle-orb.js`](../js/particle-orb.js) | Home's interactive animated canvas orb. |
| [`js/subpage-orbits.js`](../js/subpage-orbits.js) | Five distinct animated subpage canvas scenes and lifecycle handling. |
| [`js/supabase-config.js`](../js/supabase-config.js) | Owner-supplied public Supabase URL, publishable key, and site origin. |
| [`js/supabase-auth.js`](../js/supabase-auth.js) | Localized account dialog, registration, username login, recovery, account changes, session state, and admin-review UI. |

Scripts are loaded directly from `index.html` with `defer`; there is no bundler or module build.

## 9. Project structure, assets, deployment, and configuration

```text
index.html
README.md
docs/
  PROJECT_HANDOFF.md
  SUPABASE_SETUP.md
supabase/
  config.toml
  functions/
    _shared/auth.ts
    username-login/index.ts
    admin-student-review/index.ts
    change-password/index.ts
  schema.sql
css/
  style.css
  style.css.pre-i18n.bak
js/
  main.js
  translations.js
  budget-planner.js
  particle-orb.js
  subpage-orbits.js
  supabase-config.js
  supabase-auth.js
  *.pre-i18n.bak
LOGO-HUFLIT-OFFICIAL.png
growise-marketing-plan.txt
growise-ke-hoach-marketing.txt
GROWISE-5-HEROES-PACK-v2.html
growise-feedback-hero-minimal-v3.html
index.html.pre-i18n.bak
index.prototype.backup.html
```

`README.md` instructs users to open `index.html` or serve the folder with a static file server. `package.json`/`package-lock.json` currently provide the Supabase CLI as a development dependency, but define no package scripts; the browser loads Supabase JS v2 from a CDN. `tests/username.test.js` is a Node built-in test file and runs with `node --test tests/username.test.js`. The owner reports that the Supabase schema and three Edge Functions were applied/deployed; this was not independently checked. The username migration described below has not been applied. No `.env` or deployment workflow is present. The two marketing-plan text files and HUFLIT logo are existing assets. Backup files and prototypes are to be preserved.

## 10. Latest requirements-audit results

These statuses carry forward the latest website audit. The auth files were added afterward and are not covered by the earlier browser results. The earlier results do not establish conformity to a missing instructor rubric.

| Area | Status | Evidence and known limitation |
|---|---|---|
| Home | **PARTIAL** | Hero, challenge/purpose-related content, Why Growise, toolkit and calls to action exist. The requested “Our Purpose” and “Our Services” are not separate named sections. |
| About Us | **PARTIAL** | Story, mission, vision, audience, and team note exist. Verified member names and responsibilities remain unavailable. |
| Services | **PASS** | Four qualified service descriptions, potential benefits, and relevant calls to action are present. |
| Budget Planner | **PASS** | Seven inputs, 100% illustrative allocation, priorities, metrics, test interval, low-budget guidance, and copy/download exist. |
| Resources | **UNVERIFIED** | Four categories and six substantive guides exist, but the instructor's required category reference was not found. |
| Consultation | **PARTIAL** | Validation and success/demo messaging work. The current form has nine fields while the earlier checklist requested eight; no field was removed without clarification. |
| Feedback | **PASS** | Three steps, seven required ratings, three optional questions, validation, thank-you state, and independent route work. No server persistence is claimed. |
| User journey/routes | **PASS** | All seven hashes were navigated; links and unique IDs were checked. Feedback can be opened independently. |
| VI/EN and dynamic text | **PASS** | Checked static and dynamic labels, Planner output, modal article, and form messages in both locales. Localized text audit reported no missing keys. |
| Responsive/animation/console | **PASS** | 42 viewport combinations had no horizontal overflow; visible animation and pause behavior were checked; no browser console/page errors were observed in the checked journey. |
| Technical syntax | **PARTIAL** | The earlier audit ran `node --check` on the seven original JavaScript files. In the username-refactor continuation, `node --check` passed for all eight files under `js/` and the test file; `node --test tests/username.test.js` passed all five tests; Node's type-stripping parser accepted all four Edge Function TypeScript files; and `git diff --check` passed. `supabase db lint --local` could not connect because local PostgreSQL at `127.0.0.1:54322` is not running. These checks do not type-check against Deno/Supabase or validate live SQL. |
| Instructor reference | **UNVERIFIED** | No official rubric or required Resources-category reference was located. |
| Authentication | **PARTIAL / LIVE BEHAVIOR UNVERIFIED** | Earlier browser checks covered account UI, VI/EN validation, routes, duplicate IDs, console, and overflow. The owner now reports schema/functions deployed; this is not independently verified. Username refactor regression tests cover normalization, three-field registration, and source format alignment. Live registration/login/recovery/session/RLS/role enforcement and the manual migration remain untested. |

### Username-format continuation verification

- The registered username contract is `name-mssv`; the frontend helper and login Edge Function normalize the name to lowercase ASCII letters (including Vietnamese diacritic removal and `đ` → `d`), require a non-empty alphanumeric MSSV, require exactly one separator, reject student registration as `admin`, and enforce a 64-character maximum.
- `node --test tests/username.test.js`: **PASS**, 5 tests.
- Browser UI check: **PASS** for three signup inputs, invalid-username VI/EN messages, normalized `Đạt-231283H1` metadata (`dat-231283h1`), and the confirmation/pending message using a mocked Auth response. No account was created against Supabase.
- Responsive browser check: **PASS** at 360, 390, 768, 1024, and 1440 CSS px for both the page and the open signup modal; no horizontal overflow measured.
- Node syntax/type-stripping parse of all four Edge Function `.ts` files: **PASS**. This is not a Deno type check and does not resolve or validate Supabase imports.
- `git diff --check`: **PASS**. Local `supabase db lint --local` was attempted but could not connect to PostgreSQL on `127.0.0.1:54322`; no production Supabase connection or migration was attempted. Hosted Auth policy, SQL behavior, deployed function versions, and end-to-end account flows remain **UNVERIFIED**.

## 11. Git state and preservation notes

The baseline branch was `main` at `1c29a87` (`feat: integrate V2 3D subpage heroes`). Before the username-refactor continuation, the existing tracked modifications included:

- `css/style.css`
- `index.html`
- `js/main.js`
- `js/translations.js`

Existing untracked prototypes include:

- `GROWISE-5-HEROES-PACK-v2.html`
- `growise-feedback-hero-minimal-v3.html`

The repository also contains the `.pre-i18n.bak` files and `index.prototype.backup.html`; they are tracked in Git. Do not discard, overwrite, rename, or clean any of these existing changes or files.

At the username-refactor continuation, `git status --short` also showed new untracked `package.json`, `package-lock.json`, `node_modules/`, `js/supabase-config.js`, `js/supabase-auth.js`, `js/username.js`, `supabase/`, `tests/`, and `docs/`; the two prototypes above remain untracked. Tracked `index.html`, `css/style.css`, `js/main.js`, and `js/translations.js` also remain modified from earlier work. Preserve every item; no commit or push was made.

## 12. Supabase authentication: implementation state and handoff

### Verified constraints

- Keep the plain HTML/CSS/JavaScript architecture and all seven hash routes.
- Student username is an identifier in the `name-mssv` form (for example `dat-231283h1`); it is not proof of student identity. Exactly one hyphen separates a non-empty normalized name and a non-empty alphanumeric MSSV. The normalized username is lowercase, unique case-insensitively, and limited to 64 characters. Vietnamese name diacritics are removed and `đ` becomes `d`; spaces and invalid characters are stripped from the name part. MSSV spaces and punctuation are rejected. `admin` is reserved for the administrator.
- **Owner-selected student flow:** self-registration with confirmed email; an admin must separately approve student status before a `student` role is granted. Email confirmation proves mailbox access, not HUFLIT identity. No institutional email-domain allowlist was supplied.
- **Owner-selected recovery/session policy:** password recovery by verified email; keep sessions across reloads until logout.
- **Owner-selected access scope:** all seven existing routes remain public. Consultation and Feedback submissions remain public because they are currently local demo behavior with no saved/submitted records. Do not invent private records or additional pages.
- **Owner-selected admin bootstrap fallback:** if Supabase rejects `admin/admin`, use a stronger temporary development password rather than weakening production password protections. Require a password change before production.
- The initial `admin` / `admin` credentials are a development-only requirement. They must not be embedded in client code or compared there; force a password change before production.
- **Compatibility risk:** `admin` is only five characters and may be rejected by Supabase Auth's configured minimum-length or weak-password protections. Do not lower production password protections to make this development credential work.
- Supabase Auth uses email/password identities, not arbitrary username/password login. A username must be mapped server-side before calling Auth.
- A publishable/anon key may be in browser configuration; a service-role key must remain server-side.
- The owner supplied `https://oqyibynbowpegjjaigoz.supabase.co`, a publishable key, and the production origin `https://growise-five.vercel.app`. These values are configured in the browser, but the project has not been independently verified. The service-role secret was not supplied and must never be placed in the repository.

### Implemented in source; live status reported by owner, not independently verified

- [`js/supabase-config.js`](../js/supabase-config.js) contains the owner-supplied public project URL, publishable key, and redirect origin. These are browser-visible values, not server secrets.
- [`js/supabase-auth.js`](../js/supabase-auth.js) adds a localized account dialog, registration, username sign-in, email recovery/update, session restoration/sign-out, password change, and an admin student-review UI. The official Supabase JS v2 CDN is loaded from `index.html`.
- [`supabase/functions/username-login/index.ts`](../supabase/functions/username-login/index.ts) maps a canonical username to the Auth email server-side and delegates password verification to Supabase Auth. [`supabase/functions/admin-student-review/index.ts`](../supabase/functions/admin-student-review/index.ts) verifies an authenticated admin before listing/reviewing pending students. [`supabase/functions/change-password/index.ts`](../supabase/functions/change-password/index.ts) verifies the caller before changing the password and clearing the forced-change flag.
- [`supabase/functions/_shared/auth.ts`](../supabase/functions/_shared/auth.ts) contains request validation, CORS handling, client construction, and JWT/role checks. [`supabase/config.toml`](../supabase/config.toml) disables gateway JWT verification only for the public username-login endpoint.
- [`supabase/schema.sql`](../supabase/schema.sql) defines pending profiles, private roles, RLS, signup profile creation, role/status functions, and one-time admin bootstrap. The owner reports it has been applied; this has not been independently checked against the live database.
- [`supabase/migrations/20261031_username_hyphen_format.sql`](../supabase/migrations/20261031_username_hyphen_format.sql) is a separate manual transaction for an existing database. It preflights legacy format and collisions, preserves a private old-to-new map, migrates existing dotted usernames to hyphens in both profiles and Auth metadata while preserving other metadata, and updates the check constraint and trigger. It has not been run. Never rerun the full schema on an existing installation.
- The owner reports the three Edge Functions were deployed; their current deployed versions, secrets, and behavior have not been independently verified. Deploy the changed username-login function only after review and project approval.
- [`docs/SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) contains Dashboard, secrets, deployment, bootstrap, and verification instructions.
- No Supabase project connectivity, schema application, Edge Function deployment, or live authentication has been verified. All seven routes remain public. Consultation and Feedback remain client-only and are not saved to Supabase.

### Proposed database shape

- `public.growise_profiles`: `id` references `auth.users(id)`, a case-insensitively unique canonical username, student verification status, and a trusted `must_change_password` flag; users can read only their own profile and cannot write account-control fields.
- A non-exposed `growise_private.user_roles` table: server-managed `student` and/or `admin` roles, with no client insert/update/delete permissions.
- `public.growise_has_role(text)` checks only the role of the current `auth.uid()` using a fixed empty `search_path`. RLS policies for future protected tables can use this helper.
- `public.growise_set_student_status(uuid, text)` updates only an email-confirmed pending, non-admin profile and its student role. It is granted only to `service_role`; the deployed admin Edge Function must verify the caller's role before calling it.
- Do not create application-specific protected-data tables until the owner identifies what information is restricted. Do not store passwords in either table.
- The signup trigger enforces canonical lowercase `name-mssv` format and creates only a pending profile. It does not grant student access. The migration is required for an existing database that has legacy dotted usernames; it is a manual action and must not be run until preflight, backup, and owner approval are complete.

### Configuration and secrets

| Variable/configuration | Location | Secret? |
|---|---|---|
| Supabase project URL and publishable key | [`js/supabase-config.js`](../js/supabase-config.js) | No; RLS and server checks remain mandatory |
| `SUPABASE_URL` and `SUPABASE_ANON_KEY` | Edge Function secrets; the latter may equal the publishable key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function secret store only | **Yes; never in frontend files, Git, or browser storage** |
| `GROWISE_ALLOWED_ORIGINS` | Edge Function secret/config; exact production and approved development origins | No |
| Administrator's temporary password | Provision in Supabase Dashboard only; never commit/share | **Yes** |

No service-role key or account credentials are present. Supabase Dashboard setup and live tests remain pending.

### Setup and verification plan

1. Verify the supplied project URL/key in the owner's Dashboard and establish exact redirect URLs.
2. Verify the owner-reported applied schema and deployed functions in the Dashboard. Do not rerun `schema.sql` on an existing database.
3. Configure the Supabase Auth email provider, confirmation/recovery, URL allowlist, and a password minimum matching the frontend/function's 8-character minimum.
4. Back up the database, run the migration's read-only collision preflight, review it, and obtain explicit owner approval before manually applying the username migration. Leave it unapplied until then.
5. After migration review, deploy the updated functions only with explicit approval; keep service-role secrets in Supabase's secret store.
6. Exercise registration, confirmation, valid/invalid username login, recovery, email update, session restoration, sign-out, forced password change, role checks, admin review, RLS, and allowed/disallowed origins against the live project.
7. Re-test all seven public routes, VI/EN, planner/resources/forms, responsive widths, JavaScript syntax, and `git diff --check`.

### Pending owner/setup inputs

- Which admin email will the owner provision in the Dashboard? Do not send its password through chat.
- The owner has not supplied an institutional email-domain allowlist; current identity review therefore relies on manual administrator approval.
- Confirm production/development redirect URLs and permitted CORS origins when configuring Supabase.
- Decide the Auth provider's password policy in Supabase; the website defers to the configured provider policy.
- A service-role key is required only in the trusted Edge Function secret store and must never be requested for browser configuration.

## 13. Continuing development and verification checklist

- Read this handoff and inspect `git status --short` before editing. Preserve all existing changes, backups, and prototypes.
- Keep any future login UI and errors in the existing VI/EN localization system.
- Do not implement account-policy assumptions or browser-side role checks as authorization.
- Never add service-role credentials or plaintext passwords to the repository.
- Do not call authentication “connected” until the owner configures the project, applies SQL, deploys functions, and live tests pass.
- For frontend changes, run `node --check` on modified JavaScript and `git diff --check`; exercise the affected UI in a browser and retest route preservation.
- Use an actual configured Supabase project to verify auth and RLS; SQL syntax inspection alone is not proof of authorization behavior.
- Do not commit or push unless explicitly requested.
