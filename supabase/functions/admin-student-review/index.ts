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
const usernamePattern = /^[a-z]+-[a-z0-9]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeFullName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

function normalizeUsername(value: string): string | null {
  const username = value.trim().toLowerCase();
  return username !== "admin"
    && username.length <= 64
    && usernamePattern.test(username)
    ? username
    : null;
}

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
        .select("id,username,student_status,created_at")
        .neq("username", "admin")
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw new RequestError(503, "student_list_unavailable");

      const students = (await Promise.all((profiles || []).map(async (profile) => {
        const { data, error: userError } = await serviceClient.auth.admin
          .getUserById(profile.id);
        if (userError) throw new RequestError(503, "student_list_unavailable");
        if (!data.user?.email) return null;
        return {
          id: profile.id,
          username: profile.username,
          student_status: profile.student_status,
          email: data.user.email,
          created_at: profile.created_at
        };
      }))).filter((student) => student !== null);
      return jsonResponse(request, { students });
    }
    const body = await readJson(request);
    if (body.action === "provision" || body.action === "provision_existing") {
      const fullName = typeof body.full_name === "string"
        ? normalizeFullName(body.full_name)
        : "";
      const username = typeof body.username === "string"
        ? normalizeUsername(body.username)
        : null;
      const studentId = typeof body.student_id === "string"
        ? body.student_id.trim()
        : "";
      const email = typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

      if (
        !fullName
        || fullName.length > 200
        || !username
        || !studentId
        || studentId.length > 64
        || (
          body.action === "provision"
          && (!emailPattern.test(email) || email.length > 254)
        )
      ) {
        throw new RequestError(400, "invalid_student_profile");
      }

      let userId: string;
      let createdByRequest = false;
      if (body.action === "provision") {
        const { data: created, error: createError } =
          await serviceClient.auth.admin.createUser({
            email,
            email_confirm: false
          });
        if (createError || !created.user) {
          throw new RequestError(409, "student_provision_failed");
        }
        userId = created.user.id;
        createdByRequest = true;
      } else {
        const existingUserId = body.userId;
        if (typeof existingUserId !== "string" || !uuidPattern.test(existingUserId)) {
          throw new RequestError(400, "invalid_request");
        }
        const { data: existingProfile, error: profileError } = await serviceClient
          .from("growise_profiles")
          .select("id,full_name,student_id,student_status")
          .eq("id", existingUserId)
          .in("student_status", ["pending", "rejected", "verified"])
          .neq("username", "admin")
          .maybeSingle();
        if (profileError) throw new RequestError(503, "student_provision_failed");
        if (
          !existingProfile
          || (
            existingProfile.student_status === "verified"
            && existingProfile.full_name
            && existingProfile.student_id
          )
        ) {
          throw new RequestError(409, "student_provision_failed");
        }
        const { data: existingUser, error: userError } = await serviceClient.auth.admin
          .getUserById(existingUserId);
        if (userError || !existingUser.user?.email) {
          throw new RequestError(409, "student_provision_failed");
        }
        userId = existingUserId;
      }

      const { error: provisionError } = await serviceClient.rpc(
        "growise_provision_student",
        {
          target_user_id: userId,
          student_full_name: fullName,
          student_username: username,
          student_number: studentId
        }
      );
      if (provisionError) {
        if (createdByRequest) {
          const { error: cleanupError } = await serviceClient.auth.admin
            .deleteUser(userId);
          if (cleanupError) {
            throw new RequestError(500, "student_provision_cleanup_failed");
          }
        }
        throw new RequestError(409, "student_provision_failed");
      }

      return jsonResponse(
        request,
        { created: true },
        createdByRequest ? 201 : 200
      );
    }

    const userId = body.userId;
    const nextStatus = body.status;
    if (
      typeof userId !== "string"
      || !uuidPattern.test(userId)
      || nextStatus !== "rejected"
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
