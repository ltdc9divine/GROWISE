(function () {
  const i18n = window.Growise.i18n;
  const modal = document.getElementById("authModal");
  const openButton = document.getElementById("authOpen");
  const closeButton = document.getElementById("authClose");
  const statusElement = document.getElementById("authStatus");
  const navLabelKey = "auth.nav.signIn";
  const views = {
    login: document.getElementById("authLoginView"),
    register: document.getElementById("authRegisterView"),
    forgot: document.getElementById("authForgotView"),
    reset: document.getElementById("authResetView"),
    account: document.getElementById("authAccountView")
  };
  const authElements = Object.values(views);
  const config = window.GROWISE_SUPABASE_CONFIG;
  const sdk = window.supabase;
  const usernames = window.GrowiseUsername;
  const minimumPasswordLength = 8;
  let client = null;
  let currentSession = null;
  let currentProfile = null;
  let pendingStudents = [];
  let sessionRevision = 0;
  let statusMessage = null;
  let previousFocus = null;
  let recoveryFlow = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";

  function setStatus(key, kind = "info", params = {}) {
    statusMessage = key ? { key, kind, params } : null;
    if (!statusMessage) {
      statusElement.hidden = true;
      statusElement.textContent = "";
      delete statusElement.dataset.kind;
      return;
    }
    statusElement.textContent = i18n.t(key, params);
    statusElement.dataset.kind = kind;
    statusElement.hidden = false;
  }

  function setView(name) {
    authElements.forEach((element) => {
      element.hidden = element !== views[name];
    });
    setStatus(null);
    if (name === "account" && currentProfile?.must_change_password) {
      setStatus("auth.message.passwordChangeRequired", "info");
    }
  }

  function setNavigationLabel() {
    openButton.textContent = i18n.t(currentSession ? "auth.nav.account" : navLabelKey);
  }

  function normalizeLoginUsername(value) {
    return usernames.normalizeUsername(value, { allowAdmin: true }).username || null;
  }

  function isConfigured() {
    return Boolean(
      client
      && config
      && config.url
      && config.publishableKey
    );
  }

  function isNetworkFailure(error) {
    return error instanceof TypeError
      || error?.name === "AuthRetryableFetchError"
      || error?.name === "FetchError";
  }

  function openModal(initialView = "login") {
    previousFocus = document.activeElement;
    modal.classList.add("open");
    setView(initialView);
    if (!isConfigured()) setStatus("auth.message.configMissing", "error");
    document.getElementById("authTitle").focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }

  function redirectUrl() {
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return config.siteOrigin;
  }

  function showRecoveryView() {
    recoveryFlow = true;
    openModal("reset");
  }

  async function loadProfile(session) {
    const revision = ++sessionRevision;
    currentSession = session;
    currentProfile = null;
    setNavigationLabel();
    pendingStudents = [];
    document.getElementById("authAdminPanel").hidden = true;
    document.getElementById("authAdminStudents").replaceChildren();
    if (!session?.user || !client) {
      return;
    }

    try {
      const { data: profile, error } = await client
        .from("growise_profiles")
        .select("username,student_status,must_change_password")
        .eq("id", session.user.id)
        .maybeSingle();
      if (revision !== sessionRevision) return;
      if (error) {
        setStatus("auth.message.genericError", "error");
        return;
      }
      currentProfile = profile;
      document.getElementById("authAccountEmail").textContent = session.user.email || "";
      document.getElementById("authAccountUsername").textContent = profile?.username || "—";
      const statusKey = {
        pending: "auth.status.pending",
        verified: "auth.status.verified",
        rejected: "auth.status.rejected",
        not_applicable: "auth.status.notApplicable"
      }[profile?.student_status];
      document.getElementById("authAccountStatus").textContent = statusKey
        ? i18n.t(statusKey)
        : i18n.t("auth.message.genericError");

      if (!profile) {
        setStatus("auth.message.genericError", "error");
        return;
      }
      if (recoveryFlow) {
        if (modal.classList.contains("open")) {
          setView("reset");
        } else {
          openModal("reset");
        }
        return;
      }

      const { data: isAdmin, error: roleError } = await client.rpc(
        "growise_has_role",
        { requested_role: "admin" }
      );
      if (revision !== sessionRevision) return;
      if (roleError) {
        document.getElementById("authAdminPanel").hidden = true;
        pendingStudents = [];
        document.getElementById("authAdminStudents").replaceChildren();
        setStatus("auth.message.genericError", "error");
        return;
      }
      const adminPanel = document.getElementById("authAdminPanel");
      adminPanel.hidden = !isAdmin || profile.must_change_password;
      if (modal.classList.contains("open")) {
        setView("account");
      }
      if (isAdmin && !profile.must_change_password) {
        await loadPendingStudents(revision);
      } else {
        pendingStudents = [];
        document.getElementById("authAdminStudents").replaceChildren();
      }
    } catch (error) {
      if (revision === sessionRevision) {
        setStatus("auth.message.genericError", "error");
      }
    }
  }

  async function requestAdminStudents(method, body) {
    if (!currentSession?.access_token) throw new Error("Missing session");
    const response = await fetch(`${config.url}/functions/v1/admin-student-review`, {
      method,
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${currentSession.access_token}`,
        "Content-Type": "application/json"
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "request_failed");
    return payload;
  }

  function renderPendingStudents() {
    const container = document.getElementById("authAdminStudents");
    container.replaceChildren();
    if (!pendingStudents.length) {
      const empty = document.createElement("p");
      empty.textContent = i18n.t("auth.admin.empty");
      container.append(empty);
      return;
    }
    pendingStudents.forEach((student) => {
      const item = document.createElement("article");
      item.className = "auth-admin-student";
      const username = document.createElement("strong");
      username.textContent = student.username;
      const email = document.createElement("span");
      email.textContent = student.email;
      const actions = document.createElement("div");
      actions.className = "auth-admin-student-actions";
      [
        ["verified", "auth.admin.approve"],
        ["rejected", "auth.admin.reject"]
      ].forEach(([status, key]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.userId = student.id;
        button.dataset.status = status;
        button.textContent = i18n.t(key);
        actions.append(button);
      });
      item.append(username, email, actions);
      container.append(item);
    });
  }

  async function loadPendingStudents(revision) {
    const userId = currentSession?.user?.id;
    if (!userId) return;
    try {
      const { students } = await requestAdminStudents("GET");
      if (
        revision !== sessionRevision
        || currentSession?.user?.id !== userId
        || !currentProfile
        || currentProfile.must_change_password
      ) {
        return;
      }
      pendingStudents = students;
      renderPendingStudents();
    } catch (error) {
      if (revision !== sessionRevision || currentSession?.user?.id !== userId) return;
      pendingStudents = [];
      document.getElementById("authAdminStudents").replaceChildren();
      setStatus("auth.message.adminLoadError", "error");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!isConfigured()) return setStatus("auth.message.configMissing", "error");
    const form = event.currentTarget;
    const username = normalizeLoginUsername(form.elements.username.value);
    if (!username) return setStatus("auth.message.invalidCredentials", "error");
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const response = await fetch(`${config.url}/functions/v1/username-login`, {
        method: "POST",
        headers: {
          apikey: config.publishableKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password: form.elements.password.value
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.access_token || !result.refresh_token) {
        return setStatus(
          result.error === "invalid_credentials"
            ? "auth.message.invalidCredentials"
            : "auth.message.genericError",
          "error"
        );
      }
      const { data: sessionData, error } = await client.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token
      });
      if (error || !sessionData.session) {
        return setStatus("auth.message.invalidCredentials", "error");
      }
      form.reset();
      await loadProfile(sessionData.session);
    } catch (error) {
      setStatus(isNetworkFailure(error) ? "auth.message.networkError" : "auth.message.genericError", "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function handleRegistration(event) {
    event.preventDefault();
    if (!isConfigured()) return setStatus("auth.message.configMissing", "error");
    const form = event.currentTarget;
    const normalizedUsername = usernames.normalizeUsername(form.elements.username.value);
    if (!normalizedUsername.username) return setStatus("auth.message.invalidUsername", "error");
    const password = form.elements.password.value;
    if (password.length < minimumPasswordLength) {
      return setStatus("auth.message.passwordMinimum", "error");
    }
    form.elements.username.value = normalizedUsername.username;

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const { data, error } = await client.auth.signUp({
        email: form.elements.email.value.trim(),
        password,
        options: {
          data: { username: normalizedUsername.username }
        }
      });
      if (error) {
        setStatus(
          error.code === "email_provider_disabled"
            ? "auth.message.emailSignupDisabled"
            : isNetworkFailure(error)
              ? "auth.message.networkError"
              : "auth.message.registrationFailure",
          "error"
        );
        return;
      }
      if (!data.user || data.user.identities?.length === 0) {
        setStatus("auth.message.registrationFailure", "error");
        return;
      }
      if (data.session) {
        form.reset();
        await loadProfile(data.session);
      } else {
        setStatus("auth.message.registrationNeedsConfiguration", "error");
      }
    } catch (error) {
      setStatus(isNetworkFailure(error) ? "auth.message.networkError" : "auth.message.registrationFailure", "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    if (!isConfigured()) return setStatus("auth.message.configMissing", "error");
    const form = event.currentTarget;
    const email = form.elements.email.value.trim();
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl()
      });
      setStatus(error ? "auth.message.genericError" : "auth.message.recoverySent", error ? "error" : "info");
      if (!error) form.reset();
    } catch (error) {
      setStatus("auth.message.genericError", "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function submitPasswordChange(password) {
    if (password.length < minimumPasswordLength) {
      setStatus("auth.message.passwordMinimum", "error");
      return false;
    }
    if (!currentSession?.access_token) {
      setStatus("auth.message.genericError", "error");
      return false;
    }
    const response = await fetch(`${config.url}/functions/v1/change-password`, {
      method: "POST",
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${currentSession.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      if (result.error === "password_status_update_failed") {
        setStatus("auth.message.passwordChangedStatusFailed", "error");
        return false;
      }
      setStatus("auth.message.genericError", "error");
      return false;
    }
    await loadProfile(currentSession);
    setStatus("auth.message.passwordChanged");
    return true;
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    if (!isConfigured()) return setStatus("auth.message.configMissing", "error");
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      if (await submitPasswordChange(form.elements.password.value)) {
        form.reset();
        recoveryFlow = false;
        setView("account");
        setStatus("auth.message.passwordChanged");
      }
    } catch (error) {
      setStatus("auth.message.genericError", "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function handleEmailUpdate(event) {
    event.preventDefault();
    if (!client) return setStatus("auth.message.configMissing", "error");
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const { error } = await client.auth.updateUser({
        email: form.elements.email.value.trim()
      });
      setStatus(error ? "auth.message.genericError" : "auth.message.emailUpdateSent", error ? "error" : "info");
      if (!error) form.reset();
    } catch (error) {
      setStatus("auth.message.genericError", "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function handleSignOut() {
    if (!client) return;
    try {
      const { error } = await client.auth.signOut();
      if (error) {
        setStatus("auth.message.genericError", "error");
        return;
      }
      currentSession = null;
      sessionRevision += 1;
      currentProfile = null;
      pendingStudents = [];
      document.getElementById("authAdminPanel").hidden = true;
      document.getElementById("authAdminStudents").replaceChildren();
      setNavigationLabel();
      setView("login");
      setStatus("auth.message.signedOut");
    } catch (error) {
      setStatus("auth.message.genericError", "error");
    }
  }

  async function handleStudentReview(event) {
    const button = event.target.closest("button[data-user-id][data-status]");
    if (!button) return;
    button.disabled = true;
    try {
      await requestAdminStudents("POST", {
        userId: button.dataset.userId,
        status: button.dataset.status
      });
      setStatus("auth.message.reviewUpdated");
      await loadPendingStudents();
    } catch (error) {
      setStatus("auth.message.reviewError", "error");
      button.disabled = false;
    }
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || !modal.classList.contains("open")) return;
    const focusable = [...modal.querySelectorAll(
      'button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), [href], [tabindex]:not([tabindex="-1"])'
    )].filter((element) => !element.closest("[hidden]"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openButton.addEventListener("click", () => {
    if (currentSession) {
      openModal("account");
      loadProfile(currentSession);
    } else {
      openModal("login");
    }
  });
  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modal.querySelectorAll("[data-auth-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.authView));
  });
  modal.addEventListener("keydown", trapFocus);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
  });
  document.getElementById("authLoginForm").addEventListener("submit", handleLogin);
  document.getElementById("authRegisterForm").addEventListener("submit", handleRegistration);
  document.getElementById("authForgotForm").addEventListener("submit", handleForgotPassword);
  document.getElementById("authResetForm").addEventListener("submit", handlePasswordChange);
  document.getElementById("authChangePasswordForm").addEventListener("submit", handlePasswordChange);
  document.getElementById("authEmailForm").addEventListener("submit", handleEmailUpdate);
  document.getElementById("authLogout").addEventListener("click", handleSignOut);
  document.getElementById("authAdminStudents").addEventListener("click", handleStudentReview);
  modal.querySelectorAll("input[required]").forEach((input) => {
    input.addEventListener("invalid", () => {
      input.setCustomValidity(
        input.validity.valueMissing
          ? i18n.t("auth.message.required")
          : input.validity.tooShort
            ? i18n.t("auth.message.passwordMinimum")
          : i18n.t("auth.message.invalidField")
      );
    });
    input.addEventListener("input", () => input.setCustomValidity(""));
  });

  document.addEventListener("growise:localechange", () => {
    setNavigationLabel();
    modal.querySelectorAll("input[required]").forEach((input) => input.setCustomValidity(""));
    if (statusMessage) setStatus(statusMessage.key, statusMessage.kind, statusMessage.params);
    if (currentProfile?.student_status) {
      const key = {
        pending: "auth.status.pending",
        verified: "auth.status.verified",
        rejected: "auth.status.rejected",
        not_applicable: "auth.status.notApplicable"
      }[currentProfile.student_status];
      document.getElementById("authAccountStatus").textContent = i18n.t(key);
    }
    if (!document.getElementById("authAdminPanel").hidden) renderPendingStudents();
  });

  if (sdk?.createClient && config?.url && config?.publishableKey) {
    try {
      client = sdk.createClient(config.url, config.publishableKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
          flowType: "pkce"
        }
      });
      client.auth.onAuthStateChange((event, session) => {
        window.setTimeout(() => {
          if (event === "PASSWORD_RECOVERY") showRecoveryView();
          loadProfile(session);
        }, 0);
      });
      client.auth.getSession().then(({ data, error }) => {
        if (error) {
          setStatus("auth.message.genericError", "error");
          return;
        }
        currentSession = data.session;
        setNavigationLabel();
        if (recoveryFlow) showRecoveryView();
        if (currentSession) loadProfile(currentSession);
      }).catch(() => {
        setStatus("auth.message.genericError", "error");
      });
    } catch (error) {
      client = null;
    }
  }

  window.Growise = window.Growise || {};
  window.Growise.auth = {
    normalizeUsername: usernames.normalizeUsername,
    normalizeLoginUsername,
    open: openModal,
    getSession: () => currentSession
  };
  setNavigationLabel();
})();
