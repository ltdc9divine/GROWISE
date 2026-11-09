import {
  createServiceClient,
  errorResponse,
  handleOptions,
  isAllowedOrigin,
  jsonResponse,
  readJson,
  RequestError,
  requireAuthenticatedUser
} from "../_shared/auth.ts";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const industries = new Set([
  "food_beverage",
  "fashion_beauty",
  "education",
  "consumer_products",
  "services",
  "technology",
  "other"
]);
const budgets = new Set([
  "undecided",
  "under_500000",
  "vnd_500000_1000000",
  "vnd_1000000_3000000",
  "vnd_3000000_5000000",
  "over_5000000"
]);
const methods = new Set(["online", "in_person", "email_first"]);
const times = new Set(["flexible", "morning", "afternoon", "evening"]);
const ratingFields = [
  "overall",
  "usability",
  "usefulness",
  "marketing",
  "planner",
  "resources",
  "assistant"
] as const;

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStudentName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

async function findFeedbackStudent(value: unknown): Promise<string | null> {
  if (value === undefined) return null;
  if (
    !isRecord(value)
    || Object.keys(value).some((key) => key !== "full_name" && key !== "username")
    || !isString(value.full_name)
    || !isString(value.username)
  ) {
    throw new RequestError(400, "invalid_form");
  }
  const fullName = normalizeStudentName(value.full_name);
  const username = value.username.normalize("NFC").trim().toLowerCase();
  if (
    !fullName
    || fullName.length > 200
    || username.length > 64
    || !/^[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+-[a-z0-9]+$/u.test(username)
  ) {
    throw new RequestError(400, "invalid_form");
  }

  const { data, error } = await createServiceClient()
    .from("growise_users")
    .select("id,full_name")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new RequestError(503, "submission_unavailable");
  if (
    !data
    || normalizeStudentName(data.full_name).toLocaleLowerCase("vi-VN")
      !== fullName.toLocaleLowerCase("vi-VN")
  ) {
    throw new RequestError(401, "identity_mismatch");
  }
  return data.id;
}

function optionalText(value: unknown, maximum: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (!isString(value) || value.length > maximum) {
    throw new RequestError(400, "invalid_form");
  }
  return value.trim() || null;
}

function getClientAddress(request: Request): string {
  const address = request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1);
  if (!address || address.length > 128) {
    throw new RequestError(503, "rate_limit_unavailable");
  }
  return address;
}

async function hashClientAddress(address: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(address)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function consumeRateLimit(request: Request): Promise<void> {
  const client = createServiceClient();
  const { data: allowed, error } = await client.rpc(
    "growise_consume_website_form_limit",
    { submitted_client_hash: await hashClientAddress(getClientAddress(request)) }
  );
  if (error) throw new RequestError(503, "rate_limit_unavailable");
  if (allowed !== true) throw new RequestError(429, "rate_limited");
}

function validateConsultation(body: Record<string, unknown>) {
  const allowedFields = new Set([
    "action",
    "full_name",
    "email",
    "startup_name",
    "industry",
    "monthly_budget",
    "preferred_method",
    "preferred_date",
    "preferred_time",
    "challenge"
  ]);
  if (Object.keys(body).some((key) => !allowedFields.has(key))) {
    throw new RequestError(400, "invalid_form");
  }

  const fullName = isString(body.full_name)
    ? body.full_name.normalize("NFC").trim().replace(/\s+/gu, " ")
    : "";
  const email = isString(body.email) ? body.email.trim().toLowerCase() : "";
  const startupName = optionalText(body.startup_name, 200);
  const challenge = isString(body.challenge)
    ? body.challenge.trim()
    : "";
  const preferredDate = optionalText(body.preferred_date, 10);

  if (
    !fullName
    || fullName.length > 200
    || !emailPattern.test(email)
    || email.length > 254
    || !isString(body.industry)
    || !industries.has(body.industry)
    || !isString(body.monthly_budget)
    || !budgets.has(body.monthly_budget)
    || !isString(body.preferred_method)
    || !methods.has(body.preferred_method)
    || !isString(body.preferred_time)
    || !times.has(body.preferred_time)
    || !challenge
    || challenge.length > 4000
  ) {
    throw new RequestError(400, "invalid_form");
  }

  if (
    preferredDate !== null
    && (
      !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
      || Number.isNaN(Date.parse(`${preferredDate}T00:00:00.000Z`))
      || new Date(`${preferredDate}T00:00:00.000Z`).toISOString().slice(0, 10)
        !== preferredDate
    )
  ) {
    throw new RequestError(400, "invalid_form");
  }

  return {
    full_name: fullName,
    email,
    startup_name: startupName,
    industry: body.industry,
    monthly_budget: body.monthly_budget,
    preferred_method: body.preferred_method,
    preferred_date: preferredDate,
    preferred_time: body.preferred_time,
    challenge
  };
}

function validateFeedback(body: Record<string, unknown>) {
  const allowedFields = new Set([
    "action",
    "ratings",
    "liked",
    "improve",
    "requested_features",
    "student_identity"
  ]);
  if (
    Object.keys(body).some((key) => !allowedFields.has(key))
    || typeof body.ratings !== "object"
    || body.ratings === null
    || Array.isArray(body.ratings)
  ) {
    throw new RequestError(400, "invalid_form");
  }

  const ratings = body.ratings as Record<string, unknown>;
  if (
    Object.keys(ratings).length !== ratingFields.length
    || ratingFields.some((field) => {
      const rating = ratings[field];
      return typeof rating !== "number"
        || !Number.isInteger(rating)
        || rating < 1
        || rating > 5;
    })
  ) {
    throw new RequestError(400, "invalid_form");
  }

  return {
    overall_rating: ratings.overall,
    usability_rating: ratings.usability,
    usefulness_rating: ratings.usefulness,
    marketing_rating: ratings.marketing,
    planner_rating: ratings.planner,
    resources_rating: ratings.resources,
    assistant_rating: ratings.assistant,
    liked: optionalText(body.liked, 4000),
    improve: optionalText(body.improve, 4000),
    requested_features: optionalText(body.requested_features, 4000)
  };
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (!isAllowedOrigin(request.headers.get("Origin"))) {
    return jsonResponse(request, { error: "origin_not_allowed" }, 403);
  }
  if (request.method !== "POST") {
    return jsonResponse(request, { error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJson(request);
    if (body.action !== "consultation" && body.action !== "feedback") {
      throw new RequestError(400, "invalid_form");
    }

    const isConsultation = body.action === "consultation";
    let submission: Record<string, unknown>;
    if (isConsultation) {
      submission = validateConsultation(body);
    } else {
      const feedback = validateFeedback(body);
      const authorization = request.headers.get("Authorization");
      const submittedBy = authorization
        ? (await requireAuthenticatedUser(request)).user.id
        : null;
      const submittedByStudent = authorization
        ? null
        : await findFeedbackStudent(body.student_identity);
      submission = {
        ...feedback,
        submitted_by: submittedBy,
        submitted_by_student: submittedByStudent
      };
    }
    await consumeRateLimit(request);

    const client = createServiceClient();
    const table = isConsultation
      ? "growise_consultation_requests"
      : "growise_feedback_submissions";
    const { error } = await client.from(table).insert(submission);
    if (error) throw new RequestError(503, "submission_unavailable");

    return jsonResponse(request, { success: true }, 201);
  } catch (error) {
    return errorResponse(request, error);
  }
});
