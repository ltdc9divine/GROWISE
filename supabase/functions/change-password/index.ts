import {
  createServiceClient,
  errorResponse,
  handleOptions,
  jsonResponse,
  readJson,
  requireAuthenticatedUser,
  RequestError
} from "../_shared/auth.ts";

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (request.method !== "POST") {
    return jsonResponse(request, { error: "method_not_allowed" }, 405);
  }

  try {
    const caller = await requireAuthenticatedUser(request);
    const body = await readJson(request);
    if (
        typeof body.password !== "string"
        || body.password.length < 8
        || body.password.length > 1024
      ) {
        throw new RequestError(400, "invalid_request");
    }

    const serviceClient = createServiceClient();
    const { error: passwordError } = await serviceClient.auth.admin
      .updateUserById(caller.user.id, { password: body.password });
    if (passwordError) throw new RequestError(400, "password_update_failed");

    const { error: profileError, count } = await serviceClient
      .from("growise_profiles")
      .update({ must_change_password: false }, { count: "exact" })
      .eq("id", caller.user.id);
    if (profileError || count !== 1) {
      throw new RequestError(503, "password_status_update_failed");
    }

    return jsonResponse(request, { updated: true });
  } catch (error) {
    return errorResponse(request, error);
  }
});
