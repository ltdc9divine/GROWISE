import {
  createServiceClient,
  errorResponse,
  handleOptions,
  isAllowedOrigin,
  jsonResponse,
  requireAuthenticatedUser,
  RequestError
} from "../_shared/auth.ts";

const pageSizeMaximum = 50;
const feedbackBatchSize = 1000;
const ratingFields = [
  "overall_rating",
  "usability_rating",
  "usefulness_rating",
  "marketing_rating",
  "planner_rating",
  "resources_rating",
  "assistant_rating"
] as const;
const industries = new Set([
  "food_beverage",
  "fashion_beauty",
  "education",
  "consumer_products",
  "services",
  "technology",
  "other"
]);

type DashboardSection = "overview" | "students" | "consultations" | "feedback";
type FilterBuilder<T> = {
  gte(column: string, value: string): T;
  lt(column: string, value: string): T;
  or(filters: string): T;
};

function parseInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) throw new RequestError(400, "invalid_dashboard_query");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new RequestError(400, "invalid_dashboard_query");
  }
  return parsed;
}

function parseDate(value: string | null, field: string): string | null {
  if (value === null || value === "") return null;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    || new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new RequestError(400, `invalid_${field}`);
  }
  return value;
}

function parseQuery(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) {
    throw new RequestError(400, "invalid_dashboard_query");
  }
  const section = params.get("section") || "overview";
  if (!["overview", "students", "consultations", "feedback"].includes(section)) {
    throw new RequestError(400, "invalid_dashboard_section");
  }
  const allowedParams = new Set([
    "section", "q", "industry", "from", "to", "sort", "page", "page_size"
  ]);
  if ([...params.keys()].some((key) => !allowedParams.has(key))) {
    throw new RequestError(400, "invalid_dashboard_query");
  }
  const search = (params.get("q") || "").trim();
  if (search.length > 100) throw new RequestError(400, "invalid_dashboard_query");
  const industry = params.get("industry") || "";
  if (industry && !industries.has(industry)) {
    throw new RequestError(400, "invalid_industry");
  }
  const sort = params.get("sort") || "desc";
  if (sort !== "asc" && sort !== "desc") {
    throw new RequestError(400, "invalid_sort");
  }
  const from = parseDate(params.get("from"), "date");
  const to = parseDate(params.get("to"), "date");
  if (from && to && from > to) throw new RequestError(400, "invalid_date_range");

  return {
    section: section as DashboardSection,
    search,
    industry,
    from,
    to,
    sort,
    page: parseInteger(params.get("page"), 1, 1, 1000000),
    pageSize: parseInteger(params.get("page_size"), 10, 1, pageSizeMaximum)
  };
}

function safeSearch(value: string): string {
  return value.replace(/[^\p{L}\p{N}@._\-\s]/gu, "").trim();
}

function applyCreatedRange<T extends FilterBuilder<T>>(
  query: T,
  from: string | null,
  to: string | null
): T {
  let filtered = query;
  if (from) filtered = filtered.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) {
    const dayAfter = new Date(`${to}T00:00:00.000Z`);
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
    filtered = filtered.lt("created_at", dayAfter.toISOString());
  }
  return filtered;
}

function applySearch<T extends FilterBuilder<T>>(
  query: T,
  fields: string[],
  search: string
): T {
  const term = safeSearch(search);
  if (!term) return query;
  return query.or(fields.map((field) => `${field}.ilike.%${term}%`).join(","));
}

async function getCount(client: ReturnType<typeof createServiceClient>, table: string) {
  const { count, error } = await client.from(table).select("id", {
    count: "exact",
    head: true
  });
  if (error || count === null) throw new RequestError(503, "dashboard_data_unavailable");
  return count;
}

async function getFeedbackAverages(client: ReturnType<typeof createServiceClient>) {
  const totals: Record<(typeof ratingFields)[number], number> = {
    overall_rating: 0,
    usability_rating: 0,
    usefulness_rating: 0,
    marketing_rating: 0,
    planner_rating: 0,
    resources_rating: 0,
    assistant_rating: 0
  };
  let count = 0;
  for (let offset = 0; ; offset += feedbackBatchSize) {
    const { data, error } = await client
      .from("growise_feedback_submissions")
      .select(`id,${ratingFields.join(",")}`)
      .order("id", { ascending: true })
      .range(offset, offset + feedbackBatchSize - 1);
    if (error) throw new RequestError(503, "dashboard_data_unavailable");
    for (const record of data || []) {
      for (const field of ratingFields) totals[field] += record[field];
      count += 1;
    }
    if (!data || data.length < feedbackBatchSize) break;
  }
  const averages: Record<string, number | null> = {};
  for (const field of ratingFields) {
    averages[field] = count ? Number((totals[field] / count).toFixed(2)) : null;
  }
  return averages;
}

function getRecentMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const start = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - (5 - index),
      1
    ));
    const end = new Date(Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      1
    ));
    return {
      month: start.toISOString().slice(0, 7),
      start: start.toISOString(),
      end: end.toISOString()
    };
  });
}

async function getMonthlyCount(
  client: ReturnType<typeof createServiceClient>,
  table: string,
  start: string,
  end: string
) {
  const { count, error } = await client
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", start)
    .lt("created_at", end);
  if (error || count === null) {
    throw new RequestError(503, "dashboard_data_unavailable");
  }
  return count;
}

async function getConsultationsByIndustry(
  client: ReturnType<typeof createServiceClient>
) {
  return await Promise.all([...industries].map(async (industry) => {
    const { count, error } = await client
      .from("growise_consultation_requests")
      .select("id", { count: "exact", head: true })
      .eq("industry", industry);
    if (error || count === null) {
      throw new RequestError(503, "dashboard_data_unavailable");
    }
    return { industry, count };
  }));
}

async function getActivityByMonth(client: ReturnType<typeof createServiceClient>) {
  const months = getRecentMonths();
  return await Promise.all(months.map(async ({ month, start, end }) => {
    const [students, consultations, feedback] = await Promise.all([
      getMonthlyCount(client, "growise_users", start, end),
      getMonthlyCount(client, "growise_consultation_requests", start, end),
      getMonthlyCount(client, "growise_feedback_submissions", start, end)
    ]);
    return { month, students, consultations, feedback };
  }));
}

async function getSummary(client: ReturnType<typeof createServiceClient>) {
  const [
    students,
    consultations,
    feedback,
    averages,
    consultationsByIndustry,
    activityByMonth
  ] = await Promise.all([
    getCount(client, "growise_users"),
    getCount(client, "growise_consultation_requests"),
    getCount(client, "growise_feedback_submissions"),
    getFeedbackAverages(client),
    getConsultationsByIndustry(client),
    getActivityByMonth(client)
  ]);
  return {
    students,
    consultations,
    feedback,
    averages,
    consultations_by_industry: consultationsByIndustry,
    activity_by_month: activityByMonth
  };
}

async function getRecords(
  client: ReturnType<typeof createServiceClient>,
  query: ReturnType<typeof parseQuery>
) {
  const { section, search, industry, from, to, sort, page, pageSize } = query;
  if (section === "overview") return { records: [], total: 0, page, page_size: pageSize };

  const table = {
    students: "growise_users",
    consultations: "growise_consultation_requests",
    feedback: "growise_feedback_submissions"
  }[section];
  const columns = {
    students: "id,full_name,username,student_id,created_at,updated_at",
    consultations: "id,full_name,email,startup_name,industry,monthly_budget,preferred_method,preferred_date,preferred_time,challenge,created_at",
    feedback: "id,overall_rating,usability_rating,usefulness_rating,marketing_rating,planner_rating,resources_rating,assistant_rating,liked,improve,requested_features,created_at"
  }[section];
  let request = client.from(table).select(columns, { count: "exact" });
  if (section === "students") {
    request = applySearch(request, ["full_name", "username", "student_id"], search);
    request = applyCreatedRange(request, from, to);
  } else if (section === "consultations") {
    request = applySearch(request, ["full_name", "email", "startup_name"], search);
    if (industry) request = request.eq("industry", industry);
    request = applyCreatedRange(request, from, to);
  } else {
    request = applySearch(request, ["liked", "improve", "requested_features"], search);
    request = applyCreatedRange(request, from, to);
  }

  const start = (page - 1) * pageSize;
  const { data, count, error } = await request
    .order("created_at", { ascending: sort === "asc" })
    .order("id", { ascending: true })
    .range(start, start + pageSize - 1);
  if (error || count === null) throw new RequestError(503, "dashboard_data_unavailable");
  return { records: data || [], total: count, page, page_size: pageSize };
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (!isAllowedOrigin(request.headers.get("Origin"))) {
    return jsonResponse(request, { error: "origin_not_allowed" }, 403);
  }
  if (request.method !== "GET") {
    return jsonResponse(request, { error: "method_not_allowed" }, 405);
  }

  try {
    const caller = await requireAuthenticatedUser(request);
    if (!caller.isAdmin) throw new RequestError(403, "dashboard_forbidden");
    if (caller.profile.must_change_password) {
      throw new RequestError(403, "password_change_required");
    }

    const query = parseQuery(request);
    const serviceClient = createServiceClient();
    const [summary, pageData] = await Promise.all([
      getSummary(serviceClient),
      getRecords(serviceClient, query)
    ]);
    return jsonResponse(request, { summary, ...pageData });
  } catch (error) {
    return errorResponse(request, error);
  }
});
