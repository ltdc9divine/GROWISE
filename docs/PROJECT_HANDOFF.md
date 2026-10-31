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

### Owner's current requirements

- Keep the plain HTML/CSS/JavaScript architecture and all seven existing public hash routes.
- Student login asks only for full name and username. A valid new username creates a demo profile in the shared Supabase Database; an existing username requires the same normalized full name.
- Username normalization is trim + lowercase with the shared `^[a-z]+-[a-z0-9]+$` rule; `admin` is reserved. Full names preserve Vietnamese diacritics and normalize whitespace. Demo MSSV is the portion after the hyphen.
- The database is shared by localhost and Vercel. Browser `localStorage` stores only the name/username needed for a temporary UI session, and every restored session is revalidated by the backend.
- Student account details after login show only demo full name and student ID.
- Admin retains username/password sign-in, role checks, forced-password-change behavior, and student management.
- No production database migration, function deployment, commit, push, or deployment is authorized by this task.

### Current implementation in progress

- Current working branch is `feature/student-otp-login`, based on `fed03c8`; the worktree has uncommitted changes. Preserve unrelated work and do not commit/push.
- [`../js/supabase-auth.js`](../js/supabase-auth.js), [`../js/username.js`](../js/username.js), [`../js/demo-student-auth.js`](../js/demo-student-auth.js), and [`../js/translations.js`](../js/translations.js) implement server-backed name/username demo login, preserve the separate administrator password path, and restrict student display to full name and the database student ID.
- [`../supabase/migrations/20261031090700_student_demo_students.sql`](../supabase/migrations/20261031090700_student_demo_students.sql) creates the RLS-protected demo table, case-insensitive unique username index, and database-backed registration rate limit. It was applied to Supabase project `oqyibynbowpegjjaigoz`; only its unique migration version was recorded as applied. The older `20261031` username-format and `20261101` OTP migrations remain pending and were not applied.
- [`../supabase/functions/student-demo-login/index.ts`](../supabase/functions/student-demo-login/index.ts) implements the public demo endpoint with strict input validation, mismatch rejection, race handling for SQLSTATE `23505`, and registration throttling. It is ACTIVE as version 2 with `verify_jwt=false`.
- Vercel Preview `https://growise-2o8ylhod6-ltdc9divine-5816s-projects.vercel.app` is READY, with deployment protection enabled. Local browser login/revalidation and synthetic API create/reuse/mismatch/invalid-input checks passed. Interactive browser testing of Preview was blocked by the protection screen; the deployed HTML was verified through authenticated Vercel CLI access.
- Student demo sign-in does not call `student-otp-login`, send email, create Supabase Auth users/sessions, or assign Supabase roles. The old OTP Edge Function/migration remain in the repository but are unused by this frontend.
- [`../supabase/functions/username-login/index.ts`](../supabase/functions/username-login/index.ts) is restricted to the administrator account and trusted admin role.
- [`../supabase/functions/admin-student-review/index.ts`](../supabase/functions/admin-student-review/index.ts) remains admin-only and continues to manage `growise_profiles`; it does not provision demo profiles.
- [`../supabase/migrations/20261101_student_otp_login.sql`](../supabase/migrations/20261101_student_otp_login.sql) remains unused by the current demo student flow and must not be applied for it.
- [`../tests/username.test.js`](../tests/username.test.js) covers normalization, mocked service-backed creation/reuse, mismatch rejection, backend session revalidation/sign-out, migration security properties, and admin separation. [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) documents the migration, Edge Function secrets, CORS allowlist, and administrator setup.

### Security and verification limits

- The service-role key is not added to browser code. RLS is enabled and direct `anon`/`authenticated` table privileges are revoked. The rate-limit RPC is restricted to `service_role`.
- A name/username pair is not authentication. Demo data must not be used to protect personal or learning data. Do not grant the demo a Supabase role or pass its identity to admin endpoints.
- Local JavaScript tests, SQL migration execution, synthetic function requests, local browser login/revalidation, exact CORS preflights, and direct publishable-key denial were verified. Admin end-to-end behavior remains untested. Vercel Preview is protected, so its interactive login flow was not verified in the browser. Direct database RLS introspection timed out with a temporary-role password error.
- Do not apply the legacy [`../supabase/migrations/20261101_student_otp_login.sql`](../supabase/migrations/20261101_student_otp_login.sql) or claim the database flow is live until the demo migration and function have been verified against the project.

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

1. Review live Supabase project identity, existing schema, RLS, grants, triggers, and function versions; do not assume earlier owner reports reflect current deployment.
2. Review migration `20261031090700_student_demo_students.sql` and the new Edge Function before applying/deploying them. Never apply the unrelated legacy migrations as part of this demo flow.
3. Keep existing administrator Supabase Email settings, recovery, exact redirects, and allowed origins configured as required by the admin flow.
4. Configure Edge Function secrets only in the Supabase secret store and deploy the functions only after review and approval.
5. Test new profile creation, matching-name reuse, mismatch rejection, concurrent unique-username requests, session revalidation/sign-out, and confirm no Supabase session/role is created; separately test admin login and management.
6. Configure exact local, production, and actual Preview origins in `GROWISE_ALLOWED_ORIGINS`, then test localhost and Vercel Preview against the same profile. Re-test all public routes, VI/EN, planner/resources/forms, responsive widths, JavaScript syntax, and `git diff --check`.

## 13. Continuing development and verification checklist

- Read this handoff and inspect `git status --short` before editing. Preserve all existing changes, backups, and prototypes.
- Keep any future login UI and errors in the existing VI/EN localization system.
- Do not implement account-policy assumptions or browser-side role checks as authorization.
- Never add service-role credentials or plaintext passwords to the repository.
- Do not describe the name/username demo as identity authentication or as protection for private data.
- For frontend changes, run `node --check` on modified JavaScript and `git diff --check`; exercise the affected UI in a browser and retest route preservation.
- Use an actual non-production Supabase project to verify auth and RLS; SQL syntax inspection alone is not proof of authorization behavior.
- Do not commit or push unless explicitly requested.
