import {
  createServiceClient,
  errorResponse,
  handleOptions,
  jsonResponse,
  readJson,
  requireAuthenticatedUser,
  RequestError
} from "../_shared/auth.ts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (request.method !== "GET" && request.method !== "POST") {
    return jsonResponse(request, { error: "method_not_allowed" }, 405);
  }

  try {
    const caller = await requireAuthenticatedUser(request);
    if (!caller.isAdmin) throw new RequestError(403, "forbidden");
    if (caller.profile.must_change_password) {
      throw new RequestError(403, "password_change_required");
    }

    const serviceClient = createServiceClient();
    if (request.method === "GET") {
      const { data: profiles, error } = await serviceClient
        .from("growise_profiles")
        .select("id,username,created_at")
        .eq("student_status", "pending")
        .neq("username", "admin")
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw new RequestError(503, "student_list_unavailable");

      const students = (await Promise.all((profiles || []).map(async (profile) => {
        const { data, error: userError } = await serviceClient.auth.admin
          .getUserById(profile.id);
        if (userError) throw new RequestError(503, "student_list_unavailable");
        if (!data.user?.email || !data.user.email_confirmed_at) return null;
        return {
          id: profile.id,
          username: profile.username,
          email: data.user.email,
          created_at: profile.created_at
        };
      }))).filter((student) => student !== null);
      return jsonResponse(request, { students });
    }

    const body = await readJson(request);
    const userId = body.userId;
    const nextStatus = body.status;
    if (
      typeof userId !== "string"
      || !uuidPattern.test(userId)
      || (nextStatus !== "verified" && nextStatus !== "rejected")
    ) {
      throw new RequestError(400, "invalid_request");
    }

    const { error } = await serviceClient.rpc("growise_set_student_status", {
      target_user_id: userId,
      next_status: nextStatus
    });
    if (error) throw new RequestError(409, "student_status_update_failed");
    return jsonResponse(request, { updated: true });
  } catch (error) {
    return errorResponse(request, error);
  }
});
