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

test("normalizes Vietnamese names and lowercase student IDs", () => {
  assert.equal(normalizeUsername("Đạt-231283H1").username, "dat-231283h1");
  assert.equal(normalizeUsername("Đạt Văn-231283H1").username, "datvan-231283h1");
  assert.equal(normalizeUsername("d@t-231283H1").username, "dt-231283h1");
  assert.equal(normalizeUsername("dat-231283h1").username, "dat-231283h1");
});

test("rejects malformed, ambiguous, or reserved student usernames", () => {
  for (const username of [
    "",
    "-231283h1",
    "dat-",
    "dat",
    "-",
    "dat-2312-h1",
    "dat 231283h1",
    "dat-2312 h1",
    "dat-231283h1 ",
    "dat-2312!",
    "admin"
  ]) {
    assert.equal(normalizeUsername(username).error, "invalid", username);
  }
});

test("accepts admin only when explicitly allowed", () => {
  assert.equal(normalizeUsername("ADMIN", { allowAdmin: true }).username, "admin");
  assert.equal(normalizeUsername("admin").error, "invalid");
});

test("registration form has only username, confirmation email, and password", () => {
  const html = readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const auth = readFileSync(
    path.join(__dirname, "..", "js", "supabase-auth.js"),
    "utf8"
  );
  const form = html.match(/<form id="authRegisterForm"[\s\S]*?<\/form>/)?.[0];
  assert.ok(form, "registration form exists");
  const inputs = [...form.matchAll(/<input\b[^>]*>/g)].map((match) => match[0]);
  assert.equal(inputs.length, 3);
  assert.match(inputs[0], /name="username"/);
  assert.match(inputs[0], /placeholder="dat-231283h1"/);
  assert.match(inputs[1], /name="email"[^>]*type="email"/);
  assert.match(inputs[2], /name="password"[^>]*type="password"/);
  assert.doesNotMatch(auth, /form\.elements\.(name|studentId)\b/);
  assert.doesNotMatch(auth, /authRegister(Name|StudentId)/);
});

test("database and login function enforce the canonical stored format", () => {
  const schema = readFileSync(
    path.join(__dirname, "..", "supabase", "schema.sql"),
    "utf8"
  );
  const migration = readFileSync(
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

  assert.ok(schema.includes("username ~ '^[a-z]+-[a-z0-9]+$'"));
  assert.ok(schema.includes("submitted_username !~ '^[a-z]+-[a-z0-9]+$'"));
  assert.ok(migration.includes("username ~ '^[a-z]+-[a-z0-9]+$'"));
  assert.match(migration, /raw_user_meta_data[\s\S]*jsonb_build_object\('username', mapping\.new_username\)/);
  assert.match(loginFunction, /const usernamePattern = \/\^\[a-z\]\+-\[a-z0-9\]\+\$\//);
  assert.match(loginFunction, /normalizeUsername\(submittedUsername\)/);
  assert.match(migration, /target_username/);
  assert.match(migration, /raise exception[\s\S]*?conflict/i);
});
