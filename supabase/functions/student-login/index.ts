import {
  createServiceClient,
  errorResponse,
  handleOptions,
  isAllowedOrigin,
  jsonResponse,
  readJson,
  RequestError
} from "../_shared/auth.ts";

const usernamePattern = /^[a-z]+-[a-z0-9]+$/;

type StudentProfile = {
  full_name: string;
  student_id: string;
};

function normalizeFullName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function namesMatch(left: string, right: string): boolean {
  return normalizeFullName(left).toLocaleLowerCase("vi-VN")
    === normalizeFullName(right).toLocaleLowerCase("vi-VN");
}

function getClientAddress(request: Request): string {
  const cloudflareAddress = request.headers.get("cf-connecting-ip")?.trim();
  const forwardedAddress = request.headers.get("x-forwarded-for")
    ?.split(",")
    .map((address) => address.trim())
    .filter(Boolean)
    .at(-1);
  const address = cloudflareAddress || forwardedAddress;
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

async function findStudent(username: string): Promise<StudentProfile | null> {
  const { data, error } = await createServiceClient()
    .from("growise_users")
    .select("full_name,student_id")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new RequestError(503, "student_lookup_unavailable");
  if (data === null) return null;
  if (
    typeof data?.full_name !== "string"
    || typeof data?.student_id !== "string"
  ) {
    throw new RequestError(503, "student_lookup_unavailable");
  }
  return { full_name: data.full_name, student_id: data.student_id };
}

function rejectNameMismatch(): never {
  throw new RequestError(409, "identity_mismatch");
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
    const contentType = request.headers.get("Content-Type") || "";
    if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw new RequestError(400, "invalid_request");
    }

    const body = await readJson(request);
    if (
      Object.keys(body).some((key) => key !== "full_name" && key !== "username")
      || typeof body.full_name !== "string"
      || typeof body.username !== "string"
      || body.full_name.length > 512
      || body.username.length > 128
    ) {
      throw new RequestError(400, "invalid_request");
    }

    const fullName = normalizeFullName(body.full_name);
    if (!fullName) throw new RequestError(400, "full_name_required");
    if (fullName.length > 200) {
      throw new RequestError(400, "invalid_full_name");
    }

    const username = normalizeUsername(body.username);
    if (username.length > 64 || !usernamePattern.test(username)) {
      throw new RequestError(400, "invalid_username");
    }
    const studentId = username.split("-")[1];

    const existing = await findStudent(username);
    if (existing) {
      if (!namesMatch(existing.full_name, fullName)) rejectNameMismatch();
      return jsonResponse(request, {
        success: true,
        created: false,
        full_name: existing.full_name,
        student_id: existing.student_id
      });
    }

    const serviceClient = createServiceClient();
    const { data: allowed, error: limitError } = await serviceClient.rpc(
      "growise_consume_student_registration_limit",
      { submitted_client_hash: await hashClientAddress(getClientAddress(request)) }
    );
    if (limitError) throw new RequestError(503, "rate_limit_unavailable");
    if (allowed !== true) throw new RequestError(429, "rate_limited");

    const { data: createdStudent, error: insertError } = await serviceClient
      .from("growise_users")
      .insert({ full_name: fullName, username, student_id: studentId })
      .select("full_name,student_id")
      .single();

    if (insertError?.code === "23505") {
      const racedStudent = await findStudent(username);
      if (!racedStudent) throw new RequestError(503, "student_lookup_unavailable");
      if (!namesMatch(racedStudent.full_name, fullName)) rejectNameMismatch();
      return jsonResponse(request, {
        success: true,
        created: false,
        full_name: racedStudent.full_name,
        student_id: racedStudent.student_id
      });
    }
    if (insertError || !createdStudent) {
      throw new RequestError(503, "student_creation_unavailable");
    }

    return jsonResponse(request, {
      success: true,
      created: true,
      full_name: createdStudent.full_name,
      student_id: createdStudent.student_id
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
