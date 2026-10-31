const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "..", "js", "username.js");
const source = readFileSync(sourcePath, "utf8");
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const { normalizeUsername } = context.globalThis.GrowiseUsername;
vm.runInNewContext(
  readFileSync(path.join(__dirname, "..", "js", "student-auth.js"), "utf8"),
  context
);

test("accepts generic username identifiers and normalizes case and outer spaces", () => {
  for (const username of [
    "thanh-23DH123456",
    "dat-24IT654321",
    "minh-ABC123456",
    "nguyen-2026123456"
  ]) {
    assert.equal(normalizeUsername(` ${username} `).username, username.toLowerCase());
  }
});

test("rejects malformed, ambiguous, and reserved student usernames", () => {
  for (const username of [
    "",
    "thanh.23DH123456",
    "thanh 23DH123456",
    "thanh-",
    "-23DH123456",
    "dat",
    "-",
    "thanh-23-DH123456",
    "thanh-23DH 123456",
    "thành-23DH123456",
    "thanh-23DH123456!",
    "admin"
  ]) {
    assert.equal(normalizeUsername(username).error, "invalid", username);
  }
});

test("normalizes full names without removing Vietnamese diacritics", () => {
  assert.equal(
    context.globalThis.GrowiseUsername.normalizeFullName("  Nguyễn   Ngọc Đan Thanh  "),
    "Nguyễn Ngọc Đan Thanh"
  );
  assert.equal(
    context.globalThis.GrowiseUsername.normalizeFullName("Nguye\u0302\u0303n"),
    "Nguyễn"
  );
  assert.equal(context.globalThis.GrowiseUsername.normalizeFullName(" \t "), "");
});

test("accepts admin only when explicitly allowed", () => {
  assert.equal(normalizeUsername("ADMIN", { allowAdmin: true }).username, "admin");
  assert.equal(normalizeUsername("admin").error, "invalid");
});

test("student login uses the canonical student service; admin keeps password login", () => {
  const html = readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const auth = readFileSync(
    path.join(__dirname, "..", "js", "supabase-auth.js"),
    "utf8"
  );
  const form = html.match(/<form id="authStudentLoginForm"[\s\S]*?<\/form>/)?.[0];
  assert.ok(form, "student login form exists");
  const inputs = [...form.matchAll(/<input\b[^>]*>/g)].map((match) => match[0]);
  assert.equal(inputs.length, 2);
  assert.match(inputs[0], /name="full_name"/);
  assert.match(inputs[0], /placeholder="Nguyễn Văn Thanh"/);
  assert.match(inputs[1], /name="username"/);
  assert.match(inputs[1], /placeholder="thanh-23DH123456"/);
  assert.match(html, /id="authAdminLoginForm"/);
  assert.match(html, /id="authAdminPassword"[^>]*type="password"/);
  assert.doesNotMatch(html, /id="authRegisterForm"/);
  assert.doesNotMatch(html, /Otp|OTP|one-time code|authStudentOtp/);
  assert.doesNotMatch(auth, /client\.auth\.signUp/);
  assert.doesNotMatch(auth, /student-otp-login|authStudentOtp|handleStudentOtp/);
  const studentHandler = auth.match(/async function handleStudentLogin\(event\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(studentHandler, "demo student login handler exists");
  assert.match(studentHandler, /await getStudentAuth\(\)\.login/);
  assert.doesNotMatch(studentHandler, /client\.auth/);

  const studentAccount = html.match(
    /<section id="authStudentAccountView"[\s\S]*?<\/section>/
  )?.[0];
  assert.ok(studentAccount, "student account view exists");
  assert.equal([...studentAccount.matchAll(/<dt\b/g)].length, 2);
  assert.match(studentAccount, /authAccountFullName/);
  assert.match(studentAccount, /authAccountStudentId/);
  assert.doesNotMatch(studentAccount, /email|username|password|phone|birth|address/i);

  const studentClient = readFileSync(
    path.join(__dirname, "..", "js", "student-auth.js"),
    "utf8"
  );
  assert.match(studentClient, /functions\/v1\/student-login/);
  assert.match(studentClient, /growise\.student-session\.v1/);
  assert.match(studentClient, /growise\.demo\.student-session\.v2/);
  assert.doesNotMatch(studentClient, /growise_demo_students|growise\.demo\.students/);
  assert.doesNotMatch(studentClient, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
});

test("frontend, database, and Edge Functions share the username regex", () => {
  const auth = readFileSync(
    path.join(__dirname, "..", "js", "supabase-auth.js"),
    "utf8"
  );
  const schema = readFileSync(
    path.join(__dirname, "..", "supabase", "schema.sql"),
    "utf8"
  );
  const usernameMigration = readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20261031_username_hyphen_format.sql"
    ),
    "utf8"
  );
  const loginFunction = readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "functions",
      "username-login",
      "index.ts"
    ),
    "utf8"
  );
  const otpFunction = readFileSync(
    path.join(__dirname, "..", "supabase", "archive", "functions", "student-otp-login", "index.ts"),
    "utf8"
  );
  const otpMigration = readFileSync(
    path.join(__dirname, "..", "supabase", "migrations", "20261101_student_otp_login.sql"),
    "utf8"
  );
  const adminReviewFunction = readFileSync(
    path.join(__dirname, "..", "supabase", "functions", "admin-student-review", "index.ts"),
    "utf8"
  );
  const legacyDemoFunction = readFileSync(
    path.join(__dirname, "..", "supabase", "archive", "functions", "student-demo-login", "index.ts"),
    "utf8"
  );
  const legacyDemoMigration = readFileSync(
    path.join(__dirname, "..", "supabase", "migrations", "20261031090700_student_demo_students.sql"),
    "utf8"
  );
  const studentFunction = readFileSync(
    path.join(__dirname, "..", "supabase", "functions", "student-login", "index.ts"),
    "utf8"
  );
  const studentMigration = readFileSync(
    path.join(__dirname, "..", "supabase", "migrations", "20261031163000_create_growise_users.sql"),
    "utf8"
  );
  const supabaseConfig = readFileSync(
    path.join(__dirname, "..", "supabase", "config.toml"),
    "utf8"
  );
  const sharedAuth = readFileSync(
    path.join(__dirname, "..", "supabase", "functions", "_shared", "auth.ts"),
    "utf8"
  );

  assert.equal(context.globalThis.GrowiseUsername.usernamePattern.source, "^[a-z]+-[a-z0-9]+$");
  assert.ok(schema.includes("username ~ '^[a-z]+-[a-z0-9]+$'"));
  assert.ok(schema.includes("submitted_username !~ '^[a-z]+-[a-z0-9]+$'"));
  assert.match(loginFunction, /const usernamePattern = \/\^\[a-z\]\+-\[a-z0-9\]\+\$\//);
  assert.match(loginFunction, /normalizeUsername\(submittedUsername\)/);
  assert.match(otpFunction, /const usernamePattern = \/\^\[a-z\]\+-\[a-z0-9\]\+\$\//);
  assert.ok(usernameMigration.includes("username ~ '^[a-z]+-[a-z0-9]+$'"));
  assert.ok(otpMigration.includes("student_username !~ '^[a-z]+-[a-z0-9]+$'"));
  assert.match(otpFunction, /shouldCreateUser: false/);
  assert.match(otpFunction, /auth\.verifyOtp/);
  assert.match(otpFunction, /\.eq\("username", username\)/);
  assert.match(otpFunction, /normalizeFullName\(profile\.full_name\)/);
  assert.match(otpFunction, /student_status !== "verified"/);
  assert.match(otpFunction, /growise_user_has_role/);
  assert.match(loginFunction, /profile\.username !== "admin"/);
  assert.match(loginFunction, /requested_role: "admin"/);
  assert.match(adminReviewFunction, /if \(!caller\.isAdmin\)/);
  assert.match(adminReviewFunction, /growise_provision_student/);
  assert.match(adminReviewFunction, /nextStatus !== "rejected"/);
  assert.match(schema, /next_status is distinct from 'rejected'/);
  assert.match(otpMigration, /next_status is distinct from 'rejected'/);
  assert.match(studentFunction, /normalizeFullName\(body\.full_name\)/);
  assert.match(studentFunction, /normalizeUsername\(body\.username\)/);
  assert.match(studentFunction, /\.from\("growise_users"\)/);
  assert.match(studentFunction, /insertError\?\.code === "23505"/);
  assert.match(studentFunction, /const racedStudent = await findStudent/);
  assert.match(studentFunction, /growise_consume_student_registration_limit/);
  assert.doesNotMatch(studentFunction, /\.auth\.|growise_profiles|growise_has_role/);
  assert.match(studentMigration, /create table public\.growise_users/);
  assert.match(studentMigration, /on public\.growise_users \(lower\(username\)\)/);
  assert.match(studentMigration, /enable row level security/);
  assert.match(studentMigration, /revoke all on table public\.growise_users/);
  assert.match(studentMigration, /to service_role/);
  assert.match(studentMigration, /already exists; inspect its schema/);
  assert.match(studentMigration, /growise_users_set_updated_at/);
  assert.match(studentMigration, /growise_consume_student_registration_limit/);
  assert.doesNotMatch(studentMigration, /\b(drop|delete from)\b/i);
  assert.doesNotMatch(studentMigration, /alter table public\.growise_profiles/i);
  assert.match(supabaseConfig, /\[functions\.student-login\]\s+verify_jwt = false/);
  assert.match(legacyDemoFunction, /\.from\("growise_demo_students"\)/);
  assert.match(legacyDemoMigration, /create table public\.growise_demo_students/);
  assert.match(sharedAuth, /function isAllowedOrigin\(origin: string \| null\)/);
});

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    has: (key) => values.has(key)
  };
}

test("student login creates and reuses a shared backend profile", async () => {
  const storage = createMemoryStorage();
  const records = new Map();
  const calls = [];
  const auth = context.globalThis.GrowiseStudentAuth.createAuth(
    { url: "https://project.supabase.co/", publishableKey: "public-key" },
    {
      storage,
      async fetch(url, options) {
        calls.push({ url, options });
        const submitted = JSON.parse(options.body);
        const existing = records.get(submitted.username);
        if (existing) {
          if (existing.full_name.toLowerCase() !== submitted.full_name.toLowerCase()) {
            return { ok: false, async json() { return { error: "identity_mismatch" }; } };
          }
          return {
            ok: true,
            async json() { return { success: true, created: false, ...existing }; }
          };
        }
        const student = {
          full_name: submitted.full_name,
          student_id: submitted.username.split("-")[1]
        };
        records.set(submitted.username, student);
        return {
          ok: true,
          async json() { return { success: true, created: true, ...student }; }
        };
      }
    }
  );
  const account = await auth.login("  Nguyễn   Văn Thanh ", " Thanh-23DH123456 ");

  assert.deepEqual(JSON.parse(JSON.stringify(account)), {
    full_name: "Nguyễn Văn Thanh",
    username: "thanh-23dh123456",
    student_id: "23dh123456"
  });
  assert.equal((await auth.login("Nguyễn Văn Thanh", "THANH-23DH123456")).student_id, account.student_id);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://project.supabase.co/functions/v1/student-login");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    full_name: "Nguyễn Văn Thanh",
    username: "thanh-23dh123456"
  });
  assert.equal(storage.has("growise.demo.students.v1"), false);
  assert.equal(storage.has("growise.student-session.v1"), true);

  const beforeRestore = calls.length;
  assert.equal((await auth.restoreSession()).student_id, account.student_id);
  assert.equal(calls.length, beforeRestore + 1);
  auth.signOut();
  assert.equal(await auth.restoreSession(), null);
  assert.equal(storage.has("growise.student-session.v1"), false);
  assert.equal(records.size, 1);
});

test("student login rejects mismatches and invalid usernames without trusting local data", async () => {
  const storage = createMemoryStorage();
  const records = new Map();
  let calls = 0;
  const auth = context.globalThis.GrowiseStudentAuth.createAuth(
    { url: "https://project.supabase.co", publishableKey: "public-key" },
    {
      storage,
      async fetch(_url, options) {
        calls += 1;
        const submitted = JSON.parse(options.body);
        if (records.has(submitted.username)) {
          return { ok: false, async json() { return { error: "identity_mismatch" }; } };
        }
        records.set(submitted.username, submitted);
        return {
          ok: true,
          async json() {
            return {
              success: true,
              created: true,
              full_name: submitted.full_name,
              student_id: submitted.username.split("-")[1]
            };
          }
        };
      }
    }
  );
  await auth.login("Nguyễn Văn Thanh", "thanh-23DH123456");

  await assert.rejects(
    auth.login("Nguyễn Văn Khác", "thanh-23DH123456"),
    (error) => error.code === "identity_mismatch"
  );
  await assert.rejects(
    auth.login("Nguyễn Văn Khác", "thanh.23DH123456"),
    (error) => error.code === "invalid_username"
  );
  assert.equal(calls, 2);
  assert.equal(records.size, 1);
});

test("legacy browser session is revalidated and migrated to the canonical key", async () => {
  const storage = createMemoryStorage();
  storage.setItem("growise.demo.student-session.v2", JSON.stringify({
    version: 2,
    full_name: "Nguyễn Văn Thanh",
    username: "thanh-23dh123456"
  }));
  let requestCount = 0;
  const auth = context.globalThis.GrowiseStudentAuth.createAuth(
    { url: "https://project.supabase.co", publishableKey: "public-key" },
    {
      storage,
      async fetch(_url, options) {
        requestCount += 1;
        const identity = JSON.parse(options.body);
        return {
          ok: true,
          async json() {
            return {
              success: true,
              created: false,
              full_name: identity.full_name,
              student_id: identity.username.split("-")[1]
            };
          }
        };
      }
    }
  );

  const restored = await auth.restoreSession();
  assert.equal(restored.full_name, "Nguyễn Văn Thanh");
  assert.equal(requestCount, 1);
  assert.equal(storage.has("growise.student-session.v1"), true);
  assert.equal(storage.has("growise.demo.student-session.v2"), false);
});
