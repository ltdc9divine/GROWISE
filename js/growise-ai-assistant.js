(function () {
  const config = window.GROWISE_SUPABASE_CONFIG;
  const i18n = window.Growise.i18n;
  const launcher = document.getElementById("assistantLauncher");
  const panel = document.getElementById("assistantPanel");
  const closeButton = document.getElementById("assistantClose");
  const clearButton = document.getElementById("assistantClear");
  const messagesElement = document.getElementById("assistantMessages");
  const statusElement = document.getElementById("assistantStatus");
  const retryButton = document.getElementById("assistantRetry");
  const form = document.getElementById("assistantForm");
  const input = document.getElementById("assistantInput");
  const sendButton = document.getElementById("assistantSend");
  const sharePlannerButton = document.getElementById("assistantSharePlanner");
  const historyKey = "growise-ai-chat-v1";
  const maximumHistory = 10;
  let history = loadHistory();
  let pendingMessage = "";
  let requestController = null;
  let requestRevision = 0;
  let busy = false;
  let latestPlannerContext = null;

  function loadHistory() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(historyKey) || "[]");
      if (!Array.isArray(stored) || stored.length > maximumHistory) return [];
      let totalLength = 0;
      const valid = stored.every((message, index) => {
        const role = index % 2 === 0 ? "user" : "model";
        if (
          !message
          || message.role !== role
          || typeof message.text !== "string"
          || !message.text.trim()
          || message.text.length > (role === "user" ? 2000 : 4000)
        ) return false;
        totalLength += message.text.length;
        return totalLength <= 8000;
      });
      return valid && stored.length % 2 === 0 ? stored : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(historyKey, JSON.stringify(history));
      return true;
    } catch {
      return false;
    }
  }

  function appendMessage(role, text, className = "") {
    const message = document.createElement("div");
    message.className = `assistant-message assistant-message-${role}${className ? ` ${className}` : ""}`;
    message.textContent = text;
    messagesElement.append(message);
    messagesElement.scrollTop = messagesElement.scrollHeight;
    return message;
  }

  function renderHistory() {
    messagesElement.replaceChildren();
    if (history.length === 0) {
      appendMessage("model", i18n.t("assistant.welcome"));
      return;
    }
    history.forEach(({ role, text }) => appendMessage(role, text));
  }

  function setBusy(value) {
    busy = value;
    sendButton.disabled = value;
    input.disabled = value;
    retryButton.disabled = value;
    sendButton.textContent = i18n.t(value ? "assistant.send.pending" : "assistant.send");
    statusElement.hidden = !value;
    statusElement.textContent = value ? i18n.t("assistant.status.thinking") : "";
  }

  function errorMessage(error) {
    const code = error?.code || error?.error;
    const messages = {
      network_error: "assistant.error.network",
      rate_limited: "assistant.error.rateLimited",
      quota_exceeded: "assistant.error.quota",
      service_not_configured: "assistant.error.notConfigured",
      model_not_configured: "assistant.error.modelNotConfigured",
      groq_credentials_invalid: "assistant.error.credentials",
      groq_bad_request: "assistant.error.badRequest",
      request_timeout: "assistant.error.timeout",
      invalid_request: "assistant.error.invalidRequest",
      message_too_long: "assistant.error.messageTooLong",
      history_too_long: "assistant.error.historyTooLong",
      request_too_large: "assistant.error.requestTooLarge",
      rate_limit_unavailable: "assistant.error.unavailable",
      provider_unavailable: "assistant.error.provider",
      empty_response: "assistant.error.empty"
    };
    if (
      code === "model_unavailable"
      || code === "model_temporarily_unavailable"
    ) {
      const models = Array.isArray(error.models) && error.models.length
        ? error.models.join(", ")
        : i18n.t("assistant.error.noModels");
      const messageKey = code === "model_temporarily_unavailable"
        ? "assistant.error.modelTemporary"
        : "assistant.error.modelUnavailable";
      return i18n.t(messageKey, { models });
    }
    return i18n.t(messages[code] || "assistant.error.generic");
  }

  async function requestReply(message, isRetry = false) {
    const revision = ++requestRevision;
    requestController = new AbortController();
    setBusy(true);
    retryButton.hidden = true;
    if (isRetry) {
      messagesElement.querySelector(".assistant-message-error")?.remove();
    }

    try {
      if (!config?.url || !config?.publishableKey) {
        throw { code: "service_not_configured" };
      }
      const response = await fetch(
        `${config.url.replace(/\/+$/, "")}/functions/v1/growise-ai-assistant`,
        {
          method: "POST",
          headers: {
            apikey: config.publishableKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: boundedMessages(message)
          }),
          signal: requestController.signal
        }
      );

      let payload;
      try {
        payload = await response.json();
      } catch {
        if (response.status === 504) throw { code: "request_timeout" };
        throw { code: "provider_unavailable" };
      }
      if (response.status === 504) throw { code: "request_timeout" };
      if (!response.ok) throw payload;
      if (typeof payload?.reply !== "string" || !payload.reply.trim()) {
        throw { code: "empty_response" };
      }

      if (revision !== requestRevision) return;
      history = [
        ...history,
        { role: "user", text: message },
        { role: "model", text: payload.reply.trim() }
      ].slice(-maximumHistory);
      while (history.reduce((total, item) => total + item.text.length, 0) > 8000) {
        history.splice(0, 2);
      }
      if (!saveHistory()) {
        appendMessage("model", i18n.t("assistant.error.sessionStorage"));
      }
      appendMessage("model", payload.reply.trim());
      pendingMessage = "";
    } catch (error) {
      if (revision !== requestRevision || error?.name === "AbortError") return;
      const normalizedError = error instanceof TypeError
        ? { code: "network_error" }
        : error;
      appendMessage("error", errorMessage(normalizedError), "assistant-message-error");
      pendingMessage = message;
      retryButton.hidden = false;
    } finally {
      if (revision === requestRevision) {
        requestController = null;
        setBusy(false);
        input.focus();
      }
    }
  }

  function boundedMessages(message) {
    const messages = [...history, { role: "user", text: message }];
    while (
      messages.length > 11
      || messages.reduce((total, item) => total + item.text.length, 0) > 8000
    ) {
      messages.splice(0, 2);
    }
    return messages;
  }

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  function renderLauncher() {
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";
    const label = document.createElement("span");
    label.textContent = i18n.t("assistant.launcher");
    launcher.replaceChildren(icon, label);
  }

  launcher.addEventListener("click", () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });
  closeButton.addEventListener("click", closePanel);

  clearButton.addEventListener("click", () => {
    requestRevision += 1;
    requestController?.abort();
    requestController = null;
    history = [];
    pendingMessage = "";
    retryButton.hidden = true;
    input.value = "";
    setBusy(false);
    let clearFailed = false;
    try {
      sessionStorage.removeItem(historyKey);
    } catch {
      clearFailed = true;
    }
    renderHistory();
    if (clearFailed) appendMessage("error", i18n.t("assistant.error.clearSession"));
    input.focus();
  });

  retryButton.addEventListener("click", () => {
    if (pendingMessage && !busy) requestReply(pendingMessage, true);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || busy) return;
    if (message.length > 2000) {
      appendMessage("error", i18n.t("assistant.error.messageTooLong"), "assistant-message-error");
      return;
    }
    pendingMessage = "";
    appendMessage("user", message);
    input.value = "";
    requestReply(message);
  });

  function selectedText(id) {
    const select = document.getElementById(id);
    return select.options[select.selectedIndex]?.textContent?.trim() || "";
  }

  function sharePlannerContext() {
    const context = latestPlannerContext;
    if (context?.plan && context?.inputs) {
      const { plan, inputs } = context;
      const shorten = (value, maximumLength) => {
        const text = typeof value === "string" ? value.trim() : "";
        return text.length > maximumLength ? `${text.slice(0, maximumLength - 1)}…` : text;
      };
      const allocations = plan.allocations.map((item) =>
        `${shorten(item.activity, 48)} ${item.percentage}% (${item.amount.toLocaleString("vi-VN")} VND)`
      ).join("; ");
      const channels = plan.channels.map((item) =>
        `${shorten(item.name, 36)}: ${shorten(item.why, 55)}`
      ).join("; ");
      const actions = plan.actionPlan
        .slice()
        .sort((left, right) => left.priority - right.priority)
        .map((item) => `${shorten(item.week, 24)}: ${shorten(item.action, 62)}`)
        .join("; ");
      const kpis = plan.kpis.map((item) => shorten(item.name, 32)).join(", ");
      const prompt = i18n.t("assistant.plannerAiPrompt", {
        startup: shorten(inputs.startupName || "not provided", 70),
        product: shorten(inputs.product || "not provided", 100),
        industry: selectedText("industry"),
        audience: selectedText("audience"),
        objective: selectedText("goal"),
        channels: selectedText("channels"),
        budget: document.getElementById("budgetDisplay").textContent.trim(),
        allocations: shorten(allocations, 500),
        channelsPlan: shorten(channels, 230),
        actions: shorten(actions, 260),
        kpis: shorten(kpis, 180),
        explanation: shorten(plan.explanation, 180)
      });
      input.value = prompt.length > 1900 ? `${prompt.slice(0, 1899)}…` : prompt;
    } else {
      const allocations = [...document.querySelectorAll("#allocation .alloc-row")]
        .map((row) => `${row.children[0].textContent.trim()}: ${row.children[2].textContent.trim()}`)
        .join("; ");
      const priorities = [...document.querySelectorAll("#priorityList .priority span")]
        .map((item) => item.textContent.trim())
        .join("; ");
      input.value = i18n.t("assistant.plannerPrompt", {
        industry: selectedText("industry"),
        audience: selectedText("audience"),
        budget: document.getElementById("budgetDisplay").textContent.trim(),
        goal: selectedText("goal"),
        channels: selectedText("channels"),
        allocations,
        metric: document.getElementById("kpiMetric").textContent.trim(),
        priorities
      });
    }

    openPanel();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  sharePlannerButton.addEventListener("click", sharePlannerContext);
  document.getElementById("assistantShareAiPlan").addEventListener("click", sharePlannerContext);
  document.addEventListener("growise:planner-plan-updated", (event) => {
    latestPlannerContext = event.detail;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });

  document.addEventListener("growise:localechange", () => {
    renderLauncher();
    if (
      history.length === 0
      && !busy
      && !pendingMessage
      && messagesElement.children.length === 1
      && messagesElement.firstElementChild.classList.contains("assistant-message-model")
    ) renderHistory();
    if (statusElement.hidden) return;
    statusElement.textContent = i18n.t("assistant.status.thinking");
  });

  renderLauncher();
  renderHistory();
})();
