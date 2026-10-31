import {
  createPublicClient,
  createServiceClient,
  errorResponse,
  handleOptions,
  jsonResponse,
  readJson,
  RequestError
} from "../_shared/auth.ts";

const usernamePattern = /^[a-z]+-[a-z0-9]+$/;
const otpPattern = /^[a-z0-9]{4,12}$/i;

function normalizeFullName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
}

function normalizeUsername(value: string): string | null {
  const username = value.trim().toLowerCase();
  return username !== "admin"
    && username.length <= 64
    && usernamePattern.test(username)
    ? username
    : null;
}

async function findMatchingProfile(fullName: string, username: string) {
  const serviceClient = createServiceClient();
  const { data: profile, error } = await serviceClient
    .from("growise_profiles")
    .select("id,username,full_name,student_id,student_status")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new RequestError(503, "identity_lookup_unavailable");
  if (
    !profile
    || !profile.full_name
    || normalizeFullName(profile.full_name) !== normalizeFullName(fullName)
  ) {
    return null;
  }
  return { serviceClient, profile };
}

async function getAccountEmail(
  serviceClient: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<string | null> {
  const { data, error } = await serviceClient.auth.admin.getUserById(userId);
  if (error) throw new RequestError(503, "identity_lookup_unavailable");
  return data.user?.email || null;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (request.method !== "POST") {
    return jsonResponse(request, { error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJson(request);
    const fullName = body.full_name;
    const submittedUsername = body.username;
    const action = body.action;
    if (
      typeof fullName !== "string"
      || fullName.length > 200
      || typeof submittedUsername !== "string"
      || submittedUsername.length > 128
      || (action !== "request" && action !== "verify")
    ) {
      throw new RequestError(400, "invalid_request");
    }

    const normalizedName = fullName.normalize("NFC").trim().replace(/\s+/g, " ");
    const username = normalizeUsername(submittedUsername);
    if (!normalizedName || !username) {
      throw new RequestError(400, "invalid_credentials");
    }

    const match = await findMatchingProfile(normalizedName, username);
    if (action === "request") {
      if (!match) return jsonResponse(request, { accepted: true });
      const email = await getAccountEmail(match.serviceClient, match.profile.id);
      if (!email) return jsonResponse(request, { accepted: true });

      const { error } = await createPublicClient().auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });
      if (error?.status === 429) {
        throw new RequestError(429, "otp_rate_limited");
      }
      if (error) throw new RequestError(503, "otp_delivery_unavailable");
      return jsonResponse(request, { accepted: true });
    }

    const submittedOtp = body.otp;
    if (
      typeof submittedOtp !== "string"
      || !otpPattern.test(submittedOtp.trim())
      || !match
    ) {
      throw new RequestError(401, "invalid_credentials");
    }

    const email = await getAccountEmail(match.serviceClient, match.profile.id);
    if (!email) throw new RequestError(401, "invalid_credentials");

    const { data, error } = await createPublicClient().auth.verifyOtp({
      email,
      token: submittedOtp.trim(),
      type: "email"
    });
    if (error || !data.session || data.user?.id !== match.profile.id) {
      throw new RequestError(401, "invalid_credentials");
    }

    if (match.profile.student_status === "rejected") {
      throw new RequestError(403, "account_locked");
    }
    if (match.profile.student_status !== "verified") {
      throw new RequestError(403, "account_pending");
    }

    const { data: isStudent, error: roleError } = await match.serviceClient.rpc(
      "growise_user_has_role",
      {
        target_user_id: match.profile.id,
        requested_role: "student"
      }
    );
    if (roleError) throw new RequestError(503, "role_check_unavailable");
    if (!isStudent) throw new RequestError(403, "account_pending");
    if (!match.profile.full_name || !match.profile.student_id) {
      throw new RequestError(403, "account_not_provisioned");
    }

    return jsonResponse(request, {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type
    });
  } catch (error) {
    if (
      error instanceof RequestError
      && (error.status === 401 || error.status === 403)
    ) {
      return jsonResponse(request, { error: error.code }, error.status);
    }
    return errorResponse(request, error);
  }
});
