const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = { globalThis: {} };
vm.runInNewContext(
  readFileSync(path.join(__dirname, "..", "js", "public-form-submissions.js"), "utf8"),
  root
);
const api = root.globalThis.GrowiseFormSubmissions;

test("public form client sends only the publishable key to the shared Edge Function", async () => {
  const calls = [];
  const client = api.createClient(
    { url: "https://project.supabase.co/", publishableKey: "public-key" },
    {
      async fetch(url, options) {
        calls.push({ url, options });
        return { ok: true, status: 201, async json() { return { success: true }; } };
      }
    }
  );

  await client.submit("consultation", {
    full_name: "Trâm",
    email: "tram@example.com"
  });

  assert.equal(calls[0].url, "https://project.supabase.co/functions/v1/submit-website-form");
  assert.equal(calls[0].options.headers.apikey, "public-key");
  assert.equal(Object.keys(calls[0].options.headers).some((key) => /service|authorization/i.test(key)), false);
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    full_name: "Trâm",
    email: "tram@example.com",
    action: "consultation"
  });
});

test("public form client reports network, rate limit, and server errors", async () => {
  const networkClient = api.createClient(
    { url: "https://project.supabase.co", publishableKey: "public-key" },
    { async fetch() { throw new Error("offline"); } }
  );
  await assert.rejects(
    networkClient.submit("feedback", {}),
    (error) => error.code === "network_error"
  );

  const limitedClient = api.createClient(
    { url: "https://project.supabase.co", publishableKey: "public-key" },
    { async fetch() { return { ok: false, async json() { return { error: "rate_limited" }; } }; } }
  );
  await assert.rejects(
    limitedClient.submit("feedback", {}),
    (error) => error.code === "rate_limited"
  );

  const failedClient = api.createClient(
    { url: "https://project.supabase.co", publishableKey: "public-key" },
    { async fetch() { return { ok: false, async json() { return { error: "submission_unavailable" }; } }; } }
  );
  await assert.rejects(
    failedClient.submit("consultation", {}),
    (error) => error.code === "submission_unavailable"
  );
});

test("form submission migration protects submissions and rate limits behind service role", () => {
  const migration = readFileSync(
    path.join(__dirname, "..", "supabase", "migrations", "20261031221700_store_public_form_submissions.sql"),
    "utf8"
  );
  const functionSource = readFileSync(
    path.join(__dirname, "..", "supabase", "functions", "submit-website-form", "index.ts"),
    "utf8"
  );
  const html = readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const main = readFileSync(path.join(__dirname, "..", "js", "main.js"), "utf8");

  assert.match(migration, /create table public\.growise_consultation_requests/);
  assert.match(migration, /create table public\.growise_feedback_submissions/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.growise_consultation_requests[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /revoke all on table public\.growise_feedback_submissions[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /growise_consume_website_form_limit/);
  assert.match(functionSource, /isAllowedOrigin/);
  assert.match(functionSource, /growise_consume_website_form_limit/);
  assert.match(functionSource, /growise_consultation_requests/);
  assert.match(functionSource, /growise_feedback_submissions/);
  assert.match(functionSource, /overall_rating/);
  assert.match(functionSource, /requested_features/);
  assert.match(functionSource, /readJson\(request\)/);
  assert.match(functionSource, /createServiceClient\(\)/);
  assert.match(html, /js\/public-form-submissions\.js/);
  assert.match(html, /consultation\.privacy\.note/);
  assert.match(html, /feedback\.privacyNote/);
  assert.match(main, /formSubmissionClient\.submit\('consultation'/);
  assert.match(main, /formSubmissionClient\.submit\('feedback'/);
});
