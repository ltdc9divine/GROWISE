const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = {
  URLSearchParams,
  window: {
    Growise: { i18n: {} },
    fetch: async () => {
      throw new Error("Unexpected global fetch");
    }
  }
};
vm.runInNewContext(
  readFileSync(path.join(__dirname, "..", "js", "admin-dashboard.js"), "utf8"),
  root
);
const dashboardApi = root.window.GrowiseAdminDashboard;

test("admin dashboard client sends authenticated GET requests using only the publishable key", async () => {
  const calls = [];
  const client = dashboardApi.createClient(
    { url: "https://project.supabase.co/", publishableKey: "publishable-key" },
    {
      async fetch(url, options) {
        calls.push({ url, options });
        return {
          ok: true,
          async json() {
              return { summary: {}, records: [], total: 0 };
          }
        };
      }
    }
  );

  const result = await client.load(
    { access_token: "admin-access-token" },
    { section: "consultations", q: "Nguyễn Văn", page: 2, page_size: 10 }
  );

  const call = calls[0];
  const url = new URL(call.url);
  assert.equal(url.origin, "https://project.supabase.co");
  assert.equal(url.pathname, "/functions/v1/admin-dashboard-data");
  assert.equal(url.searchParams.get("section"), "consultations");
  assert.equal(url.searchParams.get("q"), "Nguyễn Văn");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(call.options.method, "GET");
  assert.equal(call.options.headers.apikey, "publishable-key");
  assert.equal(call.options.headers.Authorization, "Bearer admin-access-token");
  assert.equal("body" in call.options, false);
  assert.equal(JSON.stringify(call.options.headers).includes("service_role"), false);
  assert.deepEqual(result, { summary: {}, records: [], total: 0 });
});

test("admin dashboard client rejects missing sessions and surfaces backend errors", async () => {
  const client = dashboardApi.createClient(
    { url: "https://project.supabase.co", publishableKey: "public-key" },
    {
      async fetch() {
        return {
          ok: false,
          async json() {
            return { error: "dashboard_forbidden" };
          }
        };
      }
    }
  );
  await assert.rejects(client.load(null), /dashboard_unauthorized/);
  await assert.rejects(
    client.load({ access_token: "student-token" }),
    /dashboard_forbidden/
  );
});

test("admin dashboard Edge Function is read-only and verifies admin server-side", () => {
  const functionSource = readFileSync(
    path.join(__dirname, "..", "supabase", "functions", "admin-dashboard-data", "index.ts"),
    "utf8"
  );
  const sharedAuth = readFileSync(
    path.join(__dirname, "..", "supabase", "functions", "_shared", "auth.ts"),
    "utf8"
  );
  const config = readFileSync(
    path.join(__dirname, "..", "supabase", "config.toml"),
    "utf8"
  );

  assert.match(functionSource, /requireAuthenticatedUser\(request\)/);
  assert.match(functionSource, /if \(!caller\.isAdmin\)/);
  assert.match(functionSource, /caller\.profile\.must_change_password/);
  assert.match(functionSource, /request\.method !== "GET"/);
  assert.match(functionSource, /createServiceClient\(\)/);
  assert.match(functionSource, /growise_users/);
  assert.match(functionSource, /growise_consultation_requests/);
  assert.match(functionSource, /growise_feedback_submissions/);
  assert.match(functionSource, /consultations_by_industry/);
  assert.match(functionSource, /activity_by_month/);
  assert.match(functionSource, /getFeedbackAverages/);
  for (const field of [
    "full_name", "username", "student_id", "updated_at",
    "email", "startup_name", "industry", "monthly_budget",
    "preferred_method", "preferred_date", "preferred_time", "challenge",
    "overall_rating", "usability_rating", "usefulness_rating",
    "marketing_rating", "planner_rating", "resources_rating",
    "assistant_rating", "liked", "improve", "requested_features"
  ]) {
    assert.ok(functionSource.includes(field), `Edge Function includes ${field}`);
  }
  assert.doesNotMatch(functionSource, /\.insert\(|\.update\(|\.delete\(/);
  assert.match(sharedAuth, /auth\.getUser\(match\[1\]\)/);
  assert.match(sharedAuth, /growise_has_role/);
  assert.match(config, /\[functions\.admin-dashboard-data\]\s+verify_jwt = false/);
});

test("dashboard labels expose anonymous feedback and explicitly avoid login history claims", () => {
  const html = readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const client = readFileSync(
    path.join(__dirname, "..", "js", "admin-dashboard.js"),
    "utf8"
  );
  const translations = readFileSync(
    path.join(__dirname, "..", "js", "translations.js"),
    "utf8"
  );

  assert.match(html, /data-dashboard-section="students"/);
  assert.match(html, /data-dashboard-section="consultations"/);
  assert.match(html, /data-dashboard-section="feedback"/);
  assert.match(client, /adminDashboard\.anonymous/);
  assert.match(client, /created_at/);
  assert.doesNotMatch(client, /login_count|last_login|sign_in_count/i);
  assert.match(translations, /\["adminDashboard\.anonymous", "Anonymous feedback", "Feedback ẩn danh"\]/);
});

test("admin profile reads use columns present in the deployed growise_profiles schema", () => {
  const auth = readFileSync(
    path.join(__dirname, "..", "js", "supabase-auth.js"),
    "utf8"
  );
  const reviewFunction = readFileSync(
    path.join(__dirname, "..", "supabase", "functions", "admin-student-review", "index.ts"),
    "utf8"
  );
  const reviewGetHandler = reviewFunction.match(
    /if \(request\.method === "GET"\) \{[\s\S]*?\n    \}/
  )?.[0];

  assert.match(auth, /\.from\("growise_profiles"\)\s*\.select\("username,student_status,must_change_password"\)/);
  assert.ok(reviewGetHandler);
  assert.match(reviewGetHandler, /\.select\("id,username,student_status,created_at"\)/);
  assert.doesNotMatch(auth, /\.from\("growise_profiles"\)[\s\S]{0,100}\.select\("[^"]*(?:full_name|student_id)/);
  assert.doesNotMatch(reviewGetHandler, /full_name|student_id/);
});
