(function () {
  const i18n = window.Growise.i18n;
  const modal = document.getElementById("authModal");
  const openButton = document.getElementById("authOpen");
  const closeButton = document.getElementById("authClose");
  const statusElement = document.getElementById("authStatus");
  const navLabelKey = "auth.nav.signIn";
  const views = {
    studentLogin: document.getElementById("authStudentLoginView"),
    adminLogin: document.getElementById("authAdminLoginView"),
    forgot: document.getElementById("authForgotView"),
    reset: document.getElementById("authResetView"),
    account: document.getElementById("authAccountView")
  };
  const authElements = Object.values(views);
  const config = window.GROWISE_SUPABASE_CONFIG;
  const sdk = window.supabase;
  const usernames = window.GrowiseUsername;
  const studentAuth = window.GrowiseStudentAuth;
  const adminDashboard = window.GrowiseAdminDashboard;
  const minimumPasswordLength = 8;
  let client = null;
  let studentAuthClient = null;
  let studentLoginInFlight = false;
  let currentStudent = null;
  let currentSession = null;
  let currentProfile = null;
  let currentAccountRole = null;
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
    openButton.textContent = i18n.t(
      currentSession || currentStudent ? "auth.nav.account" : navLabelKey
    );
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

  function getStudentAuth() {
    if (!studentAuthClient) studentAuthClient = studentAuth.createAuth(config);
    return studentAuthClient;
  }

  function renderStudentAccount(student) {
    currentStudent = student;
    currentProfile = null;
    currentAccountRole = null;
    document.getElementById("authAdminAccountView").hidden = true;
    document.getElementById("authStudentAccountView").hidden = false;
    document.getElementById("authAccountFullName").textContent = student.full_name;
    document.getElementById("authAccountStudentId").textContent = student.student_id;
    setNavigationLabel();
  }

  function studentLoginErrorKey(error) {
    return {
      full_name_required: "auth.message.fullNameRequired",
      username_required: "auth.message.usernameRequired",
      invalid_username: "auth.message.invalidUsername",
      invalid_full_name: "auth.message.invalidFullName",
      identity_mismatch: "auth.message.identityMismatch",
      rate_limited: "auth.message.rateLimited",
      service_unavailable: "auth.message.serviceUnavailable",
      network_error: "auth.message.networkError",
      storage_unavailable: "auth.message.sessionStorageUnavailable",
      storage_invalid: "auth.message.sessionStorageInvalid"
    }[error?.code] || "auth.message.genericError";
  }

  let demoSessionRestoreStarted = false;

  async function restoreDemoStudentSession() {
    if (demoSessionRestoreStarted || currentSession) return;
    demoSessionRestoreStarted = true;
    try {
      const restoredStudent = await getStudentAuth().restoreSession();
      if (restoredStudent && !currentSession) {
        renderStudentAccount(restoredStudent);
      }
    } catch (error) {
      setStatus(studentLoginErrorKey(error), "error");
    }
  }

  function isNetworkFailure(error) {
    return error instanceof TypeError
      || error?.name === "AuthRetryableFetchError"
      || error?.name === "FetchError";
  }

  function openModal(initialView = "studentLogin") {
    previousFocus = document.activeElement;
    modal.classList.add("open");
    setView(initialView);
    if (
      ["adminLogin", "forgot", "reset"].includes(initialView)
      && !isConfigured()
    ) {
      setStatus("auth.message.configMissing", "error");
    }
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
    currentAccountRole = null;
    setNavigationLabel();
    pendingStudents = [];
    adminDashboard?.clear();
    document.getElementById("authAdminPanel").hidden = true;
    document.getElementById("authAdminStudents").replaceChildren();
    document.getElementById("authStudentAccountView").hidden = true;
    document.getElementById("authAdminAccountView").hidden = true;
    if (!session?.user || !client) return false;

    try {
      const { data: profile, error } = await client
        .from("growise_profiles")
        .select("username,student_status,must_change_password")
        .eq("id", session.user.id)
        .maybeSingle();
      if (revision !== sessionRevision) return null;
      if (error || !profile) {
        setStatus("auth.message.genericError", "error");
        return false;
      }
      currentProfile = profile;

      const { data: isAdmin, error: adminRoleError } = await client.rpc(
        "growise_has_role",
        { requested_role: "admin" }
      );
      if (revision !== sessionRevision) return null;
      if (adminRoleError) {
        setStatus("auth.message.genericError", "error");
        return false;
      }

      if (isAdmin) {
        currentStudent = null;
        try {
          getStudentAuth().signOut();
        } catch (error) {
          setStatus(studentLoginErrorKey(error), "error");
        }
        currentAccountRole = "admin";
        document.getElementById("authAdminAccountView").hidden = false;
        document.getElementById("authAccountEmail").textContent = session.user.email || "";
        document.getElementById("authAccountUsername").textContent = profile.username;
        const statusKey = {
          pending: "auth.status.pending",
          verified: "auth.status.verified",
          rejected: "auth.status.rejected",
          not_applicable: "auth.status.notApplicable"
        }[profile.student_status];
        document.getElementById("authAccountStatus").textContent = statusKey
          ? i18n.t(statusKey)
          : i18n.t("auth.message.genericError");
        document.getElementById("authAdminPanel").hidden = profile.must_change_password;
        if (recoveryFlow) {
          if (modal.classList.contains("open")) setView("reset");
          else openModal("reset");
          return true;
        }
        if (modal.classList.contains("open")) setView("account");
        if (!profile.must_change_password) {
          await Promise.all([
            loadPendingStudents(revision),
            Promise.resolve(adminDashboard?.load(session))
          ]);
        }
        return true;
      }

      setStatus("auth.message.useStudentLogin", "error");
      await client.auth.signOut({ scope: "local" });
      if (revision !== sessionRevision) return null;
      currentSession = null;
      currentProfile = null;
      setNavigationLabel();
      return false;
    } catch (error) {
      if (revision === sessionRevision) {
        setStatus("auth.message.genericError", "error");
        return false;
      }
      return null;
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
      const statusKey = {
        pending: "auth.status.pending",
        verified: "auth.status.verified",
        rejected: "auth.status.rejected"
      }[student.student_status];
      const status = document.createElement("span");
      status.textContent = statusKey ? i18n.t(statusKey) : "";
      item.append(username, email, status);

      const needsProvision = student.student_status !== "verified"
        || !student.full_name
        || !student.student_id;
      if (!needsProvision) {
        const fullName = document.createElement("span");
        fullName.textContent = student.full_name || "";
        const studentId = document.createElement("span");
        studentId.textContent = student.student_id || "";
        item.append(fullName, studentId);
      }

      const actions = document.createElement("div");
      actions.className = "auth-admin-student-actions";
      if (needsProvision) {
        const provisionForm = document.createElement("form");
        provisionForm.className = "auth-form";
        provisionForm.dataset.userId = student.id;
        [
          ["full_name", "auth.student.fullName", student.full_name || "", 200],
          ["student_id", "auth.student.studentId", student.student_id || "", 64],
          ["username", "auth.student.username", student.username, 64]
        ].forEach(([name, labelKey, value, maxLength]) => {
          const field = document.createElement("div");
          field.className = "field";
          const label = document.createElement("label");
          const input = document.createElement("input");
          input.name = name;
          input.value = value;
          input.maxLength = maxLength;
          input.required = true;
          input.autocomplete = "off";
          label.htmlFor = `legacy-${name}-${student.id}`;
          label.textContent = i18n.t(labelKey);
          input.id = label.htmlFor;
          field.append(label, input);
          provisionForm.append(field);
        });
        const provisionButton = document.createElement("button");
        provisionButton.type = "submit";
        provisionButton.className = "btn btn-primary";
        provisionButton.textContent = i18n.t(
          student.student_status === "rejected"
            ? "auth.admin.reactivate"
            : "auth.admin.completeProvision"
        );
        provisionForm.append(provisionButton);
        item.append(provisionForm);
      }
      if (student.student_status !== "rejected") {
        const lockButton = document.createElement("button");
        lockButton.type = "button";
        lockButton.dataset.userId = student.id;
        lockButton.dataset.status = "rejected";
        lockButton.textContent = i18n.t("auth.admin.reject");
        actions.append(lockButton);
      }
      if (actions.childElementCount) item.append(actions);
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

  async function handleAdminLogin(event) {
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
      if (await loadProfile(sessionData.session) === false) {
        await client.auth.signOut({ scope: "local" });
      }
    } catch (error) {
      setStatus(isNetworkFailure(error) ? "auth.message.networkError" : "auth.message.genericError", "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function handleStudentLogin(event) {
    event.preventDefault();
    if (studentLoginInFlight) return;
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    if (!config?.url || !config?.publishableKey) {
      return setStatus("auth.message.configMissing", "error");
    }
    studentLoginInFlight = true;
    submit.disabled = true;
    setStatus("auth.message.studentChecking");
    try {
      const student = await getStudentAuth().login(
        form.elements.full_name.value,
        form.elements.username.value
      );
      renderStudentAccount(student);
      form.reset();
      if (modal.classList.contains("open")) setView("account");
      setStatus("auth.message.loginSuccess");
    } catch (error) {
      setStatus(studentLoginErrorKey(error), "error");
    } finally {
      studentLoginInFlight = false;
      submit.disabled = false;
    }
  }

  async function handleAdminProvision(event) {
    event.preventDefault();
    if (!isConfigured()) return setStatus("auth.message.configMissing", "error");
    if (currentAccountRole !== "admin" || currentProfile?.must_change_password) {
      return setStatus("auth.message.genericError", "error");
    }

    const form = event.currentTarget;
    const fullName = usernames.normalizeFullName(form.elements.full_name.value);
    const rawUsername = form.elements.username.value.trim();
    const username = usernames.normalizeUsername(rawUsername).username;
    const studentId = form.elements.student_id.value.trim();
    const email = form.elements.email.value.trim();
    if (!fullName || !username || !studentId || !email) {
      return setStatus("auth.message.invalidField", "error");
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await requestAdminStudents("POST", {
        action: "provision",
        full_name: fullName,
        username,
        student_id: studentId,
        email
      });
      form.reset();
      setStatus("auth.message.provisioned");
    } catch (error) {
      setStatus(
        isNetworkFailure(error)
          ? "auth.message.networkError"
          : "auth.message.provisioningError",
        "error"
      );
    } finally {
      submit.disabled = false;
    }
  }

  async function handleStudentProvisionExisting(event) {
    const form = event.target.closest("form[data-user-id]");
    if (!form) return;
    event.preventDefault();
    if (currentAccountRole !== "admin" || currentProfile?.must_change_password) {
      return setStatus("auth.message.genericError", "error");
    }

    const fullName = usernames.normalizeFullName(form.elements.full_name.value);
    const username = usernames.normalizeUsername(form.elements.username.value).username;
    const studentId = form.elements.student_id.value.trim();
    if (!fullName || !username || !studentId) {
      return setStatus("auth.message.invalidField", "error");
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await requestAdminStudents("POST", {
        action: "provision_existing",
        userId: form.dataset.userId,
        full_name: fullName,
        username,
        student_id: studentId
      });
      setStatus("auth.message.provisioned");
      await loadPendingStudents(sessionRevision);
    } catch (error) {
      setStatus("auth.message.provisioningError", "error");
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
    try {
      if (currentSession && client) {
        const { error } = await client.auth.signOut();
        if (error) {
          setStatus("auth.message.genericError", "error");
          return;
        }
      }
      if (currentStudent) getStudentAuth().signOut();
      currentStudent = null;
      currentSession = null;
      sessionRevision += 1;
      currentProfile = null;
      pendingStudents = [];
      document.getElementById("authAdminPanel").hidden = true;
      document.getElementById("authAdminStudents").replaceChildren();
      setNavigationLabel();
      currentAccountRole = null;
      document.getElementById("authStudentAccountView").hidden = true;
      document.getElementById("authAdminAccountView").hidden = true;
      setView("studentLogin");
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
      await loadPendingStudents(sessionRevision);
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
    } else if (currentStudent) {
      openModal("account");
      renderStudentAccount(currentStudent);
      setView("account");
    } else {
      openModal("studentLogin");
    }
  });
  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modal.querySelectorAll("[data-auth-view]").forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.authView);
    });
  });
  modal.addEventListener("keydown", trapFocus);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
  });
  document.getElementById("authStudentLoginForm").addEventListener("submit", handleStudentLogin);
  document.getElementById("authAdminLoginForm").addEventListener("submit", handleAdminLogin);
  document.getElementById("authAdminProvisionForm").addEventListener("submit", handleAdminProvision);
  document.getElementById("authForgotForm").addEventListener("submit", handleForgotPassword);
  document.getElementById("authResetForm").addEventListener("submit", handlePasswordChange);
  document.getElementById("authChangePasswordForm").addEventListener("submit", handlePasswordChange);
  document.getElementById("authEmailForm").addEventListener("submit", handleEmailUpdate);
  document.getElementById("authLogout").addEventListener("click", handleSignOut);
  document.getElementById("authAdminStudents").addEventListener("click", handleStudentReview);
  document.getElementById("authAdminStudents").addEventListener("submit", handleStudentProvisionExisting);
  modal.querySelectorAll("input[required]").forEach((input) => {
    input.addEventListener("invalid", () => {
      input.setCustomValidity(
        input.validity.valueMissing
          ? i18n.t(
            input.name === "full_name"
              ? "auth.message.fullNameRequired"
              : input.name === "username"
                ? "auth.message.usernameRequired"
                : "auth.message.required"
          )
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
      adminDashboard?.initialize(config);
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
          if (
            session?.access_token
            && session.access_token === currentSession?.access_token
          ) {
            return;
          }
          if (!session && !currentSession) return;
          loadProfile(session);
        }, 0);
      });
      client.auth.getSession().then(async ({ data, error }) => {
        if (error) {
          setStatus("auth.message.genericError", "error");
          return;
        }
        currentSession = data.session;
        setNavigationLabel();
        if (recoveryFlow) showRecoveryView();
        if (currentSession) loadProfile(currentSession);
        else await restoreDemoStudentSession();
      }).catch(() => {
        setStatus("auth.message.genericError", "error");
      });
    } catch (error) {
      client = null;
    }
  }

  if (!client) restoreDemoStudentSession();

  window.Growise = window.Growise || {};
  window.Growise.auth = {
    normalizeUsername: usernames.normalizeUsername,
    normalizeLoginUsername,
    open: openModal,
    getSession: () => currentSession
  };
  setNavigationLabel();
})();
