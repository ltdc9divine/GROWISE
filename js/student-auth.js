(function (root) {
  const sessionStorageKey = "growise.student-session.v1";
  const legacySessionStorageKey = "growise.demo.student-session.v2";

  class StudentAuthError extends Error {
    constructor(code) {
      super(code);
      this.name = "StudentAuthError";
      this.code = code;
    }
  }

  function createAuth(config, options = {}) {
    const usernames = root.GrowiseUsername;
    const storage = options.storage || (() => {
      try {
        return root.localStorage;
      } catch {
        throw new StudentAuthError("storage_unavailable");
      }
    })();
    const fetcher = options.fetch || root.fetch?.bind(root);
    const endpoint = typeof config?.url === "string" && config.url
      ? `${config.url.replace(/\/+$/, "")}/functions/v1/student-login`
      : null;

    function normalizeInput(rawFullName, rawUsername) {
      const fullName = usernames.normalizeFullName(rawFullName);
      if (!fullName) throw new StudentAuthError("full_name_required");
      if (typeof rawUsername !== "string" || !rawUsername.trim()) {
        throw new StudentAuthError("username_required");
      }
      if (fullName.length > 200) {
        throw new StudentAuthError("invalid_full_name");
      }
      const normalized = usernames.normalizeUsername(rawUsername);
      if (!normalized.username || normalized.username.length > 64) {
        throw new StudentAuthError("invalid_username");
      }
      return { full_name: fullName, username: normalized.username };
    }

    function readSession() {
      let serialized;
      try {
        serialized = storage.getItem(sessionStorageKey);
        if (serialized === null) {
          serialized = storage.getItem(legacySessionStorageKey);
        }
      } catch {
        throw new StudentAuthError("storage_unavailable");
      }
      if (serialized === null) return null;

      let session;
      try {
        session = JSON.parse(serialized);
      } catch {
        throw new StudentAuthError("storage_invalid");
      }
      if (
        !session
        || ![1, 2].includes(session.version)
        || typeof session.full_name !== "string"
        || typeof session.username !== "string"
      ) {
        throw new StudentAuthError("storage_invalid");
      }
      return normalizeInput(session.full_name, session.username);
    }

    function saveSession(identity) {
      try {
        storage.setItem(sessionStorageKey, JSON.stringify({
          version: 1,
          ...identity
        }));
      } catch {
        throw new StudentAuthError("storage_unavailable");
      }
    }

    async function verifyWithBackend(identity) {
      if (!endpoint || !config?.publishableKey || !fetcher) {
        throw new StudentAuthError("service_unavailable");
      }

      let response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          headers: {
            apikey: config.publishableKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(identity)
        });
      } catch {
        throw new StudentAuthError("network_error");
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new StudentAuthError("service_unavailable");
      }
      if (!response.ok) {
        const code = typeof result?.error === "string" ? result.error : "";
        if (code === "identity_mismatch") {
          throw new StudentAuthError("identity_mismatch");
        }
        if (code === "rate_limited") {
          throw new StudentAuthError("rate_limited");
        }
        if (code === "invalid_full_name") {
          throw new StudentAuthError("invalid_full_name");
        }
        if (code === "invalid_username") {
          throw new StudentAuthError("invalid_username");
        }
        if (code === "invalid_request") {
          throw new StudentAuthError("invalid_request");
        }
        throw new StudentAuthError("service_unavailable");
      }

      if (
        result?.success !== true
        || typeof result.created !== "boolean"
        || typeof result.full_name !== "string"
        || typeof result.student_id !== "string"
        || result.student_id !== identity.username.split("-")[1]
      ) {
        throw new StudentAuthError("service_unavailable");
      }

      return {
        full_name: result.full_name,
        student_id: result.student_id,
        username: identity.username
      };
    }

    async function login(rawFullName, rawUsername) {
      const identity = normalizeInput(rawFullName, rawUsername);
      const student = await verifyWithBackend(identity);
      saveSession(identity);
      return student;
    }

    async function restoreSession() {
      const identity = readSession();
      if (!identity) return null;
      try {
        const student = await verifyWithBackend(identity);
        saveSession(identity);
        try {
          storage.removeItem(legacySessionStorageKey);
        } catch {
          throw new StudentAuthError("storage_unavailable");
        }
        return student;
      } catch (error) {
        if (
          error?.code === "identity_mismatch"
          || error?.code === "invalid_full_name"
          || error?.code === "invalid_username"
        ) {
          signOut();
        }
        throw error;
      }
    }

    function signOut() {
      try {
        storage.removeItem(sessionStorageKey);
        storage.removeItem(legacySessionStorageKey);
      } catch {
        throw new StudentAuthError("storage_unavailable");
      }
    }

    return Object.freeze({ login, restoreSession, signOut });
  }

  root.GrowiseStudentAuth = Object.freeze({
    StudentAuthError,
    createAuth
  });
})(globalThis);
