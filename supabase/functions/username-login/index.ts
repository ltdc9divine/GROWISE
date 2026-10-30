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

function normalizeUsername(value: string): string | null {
  if (value.trim().toLowerCase() === "admin") return "admin";

  const parts = value.split("-");
  if (parts.length !== 2) return null;

  const name = parts[0]
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const studentId = parts[1].toLowerCase();
  const username = `${name}-${studentId}`;
  if (
    !name
    || !/^[a-z0-9]+$/.test(studentId)
    || username.length > 64
    || !usernamePattern.test(username)
  ) {
    return null;
  }
  return username;
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (request.method !== "POST") {
    return jsonResponse(request, { error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readJson(request);
    const submittedUsername = body.username;
    const password = body.password;
    if (
      typeof submittedUsername !== "string"
      || submittedUsername.length > 128
      || typeof password !== "string"
      || password.length === 0
      || password.length > 1024
    ) {
      throw new RequestError(400, "invalid_credentials");
    }
    const username = normalizeUsername(submittedUsername);
    if (!username) {
      throw new RequestError(400, "invalid_credentials");
    }

    const serviceClient = createServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from("growise_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (profileError) throw new RequestError(503, "identity_lookup_unavailable");
    if (!profile) throw new RequestError(401, "invalid_credentials");

    const { data: authUser, error: userError } = await serviceClient.auth.admin
      .getUserById(profile.id);
    if (userError) throw new RequestError(503, "identity_lookup_unavailable");
    if (!authUser.user?.email || !authUser.user.email_confirmed_at) {
      throw new RequestError(401, "invalid_credentials");
    }

    const authClient = createPublicClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email: authUser.user.email,
      password
    });
    if (error?.status && error.status >= 500) {
      throw new RequestError(503, "authentication_unavailable");
    }
    if (error || !data.session) throw new RequestError(401, "invalid_credentials");

    return jsonResponse(request, {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type
    });
  } catch (error) {
    if (error instanceof RequestError && error.status === 401) {
      return jsonResponse(request, { error: "invalid_credentials" }, 401);
    }
    return errorResponse(request, error);
  }
});
