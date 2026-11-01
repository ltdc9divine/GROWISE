(function () {
  const i18n = window.Growise.i18n;
  const budget = document.getElementById("budget");
  let currentPriorityKeys = [];
  let aiRequestController = null;
  let aiRequestRevision = 0;

  function money(amount) {
    const locale = i18n.getLocale() === "vi" ? "vi-VN" : "en-US";
    return `${Math.round(amount).toLocaleString(locale)} ₫`;
  }

  function distributeAmount(total, percentages) {
    const amounts = percentages.map((percentage) => Math.floor(total * percentage / 100));
    let remaining = total - amounts.reduce((sum, amount) => sum + amount, 0);
    const order = percentages
      .map((percentage, index) => ({ index, fraction: (total * percentage) % 100 }))
      .sort((left, right) => right.fraction - left.fraction || left.index - right.index);
    for (let index = 0; remaining > 0; index += 1, remaining -= 1) {
      amounts[order[index % order.length].index] += 1;
    }
    return amounts;
  }

  function emitPlannerContext(plan, inputs) {
    document.dispatchEvent(new CustomEvent("growise:planner-plan-updated", {
      detail: { plan, inputs }
    }));
  }

  function invalidateAiPlan() {
    aiRequestRevision += 1;
    aiRequestController?.abort();
    aiRequestController = null;
    document.getElementById("plannerAiResult").hidden = true;
    document.getElementById("generatePlan").disabled = false;
    document.getElementById("plannerAiRetry").disabled = false;
    emitPlannerContext(null, null);
  }

  function capturePlanInput() {
    const amount = Number(budget.value);
    const percentages = allocationPercents();
    const baselineAmounts = distributeAmount(amount, percentages);
    return {
      startupName: document.getElementById("startupName").value.trim(),
      product: document.getElementById("product").value.trim(),
      industry: document.getElementById("industry").value,
      audience: document.getElementById("audience").value,
      budget: amount,
      objective: document.getElementById("goal").value,
      channels: document.getElementById("channels").value,
      locale: i18n.getLocale(),
      baselineAllocations: ["content", "promotion", "research", "reserve"].map(
        (category, index) => ({
          category,
          percentage: percentages[index],
          amount: baselineAmounts[index]
        })
      )
    };
  }

  function validAiPlan(plan, amount) {
    const hasText = (value, limit) =>
      typeof value === "string" && value.trim().length > 0 && value.length <= limit;
    if (
      !plan
      || plan.budget !== amount
      || !Array.isArray(plan.allocations)
      || plan.allocations.length < 3
      || plan.allocations.length > 6
      || !Array.isArray(plan.actionPlan)
      || plan.actionPlan.length !== 4
      || !Array.isArray(plan.channels)
      || plan.channels.length < 2
      || plan.channels.length > 4
      || !Array.isArray(plan.kpis)
      || plan.kpis.length < 3
      || plan.kpis.length > 5
      || !Array.isArray(plan.assumptions)
      || plan.assumptions.length > 4
      || !hasText(plan.explanation, 1000)
      || !(plan.followUpQuestion === null || hasText(plan.followUpQuestion, 300))
    ) return false;

    if (plan.allocations.some((item) =>
      !hasText(item.activity, 100)
      || !hasText(item.rationale, 400)
      || !hasText(item.objective, 240)
    )) return false;
    if (plan.channels.some((item) =>
      !hasText(item.name, 100)
      || !hasText(item.why, 300)
      || !hasText(item.advantages, 300)
      || !hasText(item.limitations, 300)
      || !hasText(item.lowBudgetStart, 300)
    )) return false;
    if (plan.actionPlan.some((item) =>
      !hasText(item.week, 40)
      || !hasText(item.action, 500)
      || !Number.isInteger(item.priority)
      || item.priority < 1
      || item.priority > 4
      || !hasText(item.measure, 240)
    )) return false;
    if (new Set(plan.actionPlan.map(({ priority }) => priority)).size !== 4) return false;
    if (plan.kpis.some((item) =>
      !hasText(item.name, 100)
      || !hasText(item.why, 240)
      || !hasText(item.howToTrack, 240)
    )) return false;
    if (plan.assumptions.some((item) => !hasText(item, 240))) return false;

    const checkAmounts = (items, percentageKey, amountKey) => {
      if (items.some((item) =>
        !Number.isInteger(item[percentageKey])
        || item[percentageKey] < 0
        || item[percentageKey] > 100
        || !Number.isSafeInteger(item[amountKey])
        || item[amountKey] < 0
      )) return false;
      const percentages = items.map((item) => item[percentageKey]);
      if (percentages.reduce((sum, percentage) => sum + percentage, 0) !== 100) {
        return false;
      }
      const amounts = distributeAmount(amount, percentages);
      return items.every((item, index) => item[amountKey] === amounts[index])
        && items.reduce((sum, item) => sum + item[amountKey], 0) === amount;
    };

    return checkAmounts(plan.allocations, "percentage", "amount")
      && checkAmounts(plan.actionPlan, "budgetPercentage", "budgetAmount");
  }

  function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function renderAiPlan(plan, inputs) {
    const allocationRoot = document.getElementById("plannerAiAllocation");
    const channelsRoot = document.getElementById("plannerAiChannels");
    const actionsRoot = document.getElementById("plannerAiActions");
    const kpisRoot = document.getElementById("plannerAiKpis");
    const assumptionsRoot = document.getElementById("plannerAiAssumptions");
    allocationRoot.replaceChildren();
    channelsRoot.replaceChildren();
    actionsRoot.replaceChildren();
    kpisRoot.replaceChildren();
    assumptionsRoot.replaceChildren();

    plan.allocations.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "planner-ai-allocation-item";
      const heading = document.createElement("div");
      heading.className = "planner-ai-allocation-heading";
      heading.append(
        createTextElement("strong", "", item.activity),
        createTextElement("span", "mono", i18n.t("planner.ai.percent", { value: item.percentage }))
      );
      const track = document.createElement("div");
      track.className = "alloc-track";
      const fill = document.createElement("div");
      fill.className = `alloc-fill planner-ai-fill planner-ai-fill-${index % 4}`;
      fill.style.width = `${item.percentage}%`;
      track.append(fill);
      card.append(
        heading,
        track,
        createTextElement("strong", "planner-ai-amount", money(item.amount)),
        createTextElement("p", "", i18n.t("planner.ai.why", { value: item.rationale })),
        createTextElement("p", "", i18n.t("planner.ai.objective", { value: item.objective }))
      );
      allocationRoot.append(card);
    });

    document.getElementById("plannerAiTotal").textContent = i18n.t("planner.ai.totalBudget", {
      amount: money(plan.budget)
    });
    document.getElementById("plannerAiExplanation").textContent = plan.explanation;
    plan.channels.forEach((item) => {
      const card = document.createElement("article");
      card.className = "planner-ai-card";
      card.append(
        createTextElement("h5", "", item.name),
        createTextElement("p", "", i18n.t("planner.ai.why", { value: item.why })),
        createTextElement("p", "", i18n.t("planner.ai.advantages", { value: item.advantages })),
        createTextElement("p", "", i18n.t("planner.ai.limitations", { value: item.limitations })),
        createTextElement("p", "", i18n.t("planner.ai.startSmall", { value: item.lowBudgetStart }))
      );
      channelsRoot.append(card);
    });

    plan.actionPlan
      .slice()
      .sort((left, right) => left.priority - right.priority)
      .forEach((item) => {
        const card = document.createElement("article");
        card.className = "planner-ai-card planner-ai-action";
        card.append(
          createTextElement("span", "eyebrow mono", item.week),
          createTextElement("h5", "", item.action),
          createTextElement("p", "", i18n.t("planner.ai.weekBudget", {
            amount: money(item.budgetAmount),
            percent: item.budgetPercentage
          })),
          createTextElement("p", "", i18n.t("planner.ai.measure", { value: item.measure }))
        );
        actionsRoot.append(card);
      });

    plan.kpis.forEach((item) => {
      const card = document.createElement("article");
      card.className = "planner-ai-card";
      card.append(
        createTextElement("h5", "", item.name),
        createTextElement("p", "", i18n.t("planner.ai.why", { value: item.why })),
        createTextElement("p", "", i18n.t("planner.ai.howToTrack", { value: item.howToTrack }))
      );
      kpisRoot.append(card);
    });

    const assumptionsSection = document.getElementById("plannerAiAssumptionsSection");
    assumptionsSection.hidden = plan.assumptions.length === 0;
    plan.assumptions.forEach((assumption) => {
      assumptionsRoot.append(createTextElement("li", "", assumption));
    });
    const followUp = document.getElementById("plannerAiFollowUp");
    followUp.hidden = !plan.followUpQuestion;
    followUp.textContent = plan.followUpQuestion
      ? i18n.t("planner.ai.followUp", { value: plan.followUpQuestion })
      : "";

    document.getElementById("plannerAiStatus").hidden = true;
    document.getElementById("plannerAiError").hidden = true;
    document.getElementById("plannerAiContent").hidden = false;
    emitPlannerContext(plan, inputs);
  }

  function aiErrorKey(code, status) {
    if (code === "quota_exceeded") return "planner.ai.error.quota";
    if (code === "request_timeout" || status === 504) return "planner.ai.error.timeout";
    if (code === "invalid_ai_plan" || code === "invalid_response") {
      return "planner.ai.error.invalid";
    }
    if (code === "rate_limited" || status === 429) return "planner.ai.error.rateLimited";
    if (code === "network_error") return "planner.ai.error.network";
    return "planner.ai.error.generic";
  }

  async function requestAiPlan() {
    const config = window.GROWISE_SUPABASE_CONFIG;
    const result = document.getElementById("plannerAiResult");
    const status = document.getElementById("plannerAiStatus");
    const errorPanel = document.getElementById("plannerAiError");
    const errorText = document.getElementById("plannerAiErrorText");
    const content = document.getElementById("plannerAiContent");
    const generateButton = document.getElementById("generatePlan");
    const revision = ++aiRequestRevision;
    const inputs = capturePlanInput();
    const controller = new AbortController();
    aiRequestController = controller;
    result.hidden = false;
    status.hidden = false;
    status.textContent = i18n.t("planner.ai.loading");
    errorPanel.hidden = true;
    content.hidden = true;
    generateButton.disabled = true;
    document.getElementById("plannerAiRetry").disabled = true;

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
          body: JSON.stringify({ mode: "budget_plan", plan: inputs }),
          signal: controller.signal
        }
      );
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw { code: response.status === 504 ? "request_timeout" : "provider_unavailable", status: response.status };
      }
      if (!response.ok) throw { ...payload, status: response.status };
      if (!validAiPlan(payload?.plan, inputs.budget)) throw { code: "invalid_ai_plan" };
      if (revision !== aiRequestRevision) return;
      renderAiPlan(payload.plan, inputs);
    } catch (error) {
      if (revision !== aiRequestRevision || error?.name === "AbortError") return;
      const normalizedError = error instanceof TypeError
        ? { code: "network_error" }
        : error;
      status.hidden = true;
      errorText.textContent = i18n.t(aiErrorKey(normalizedError?.error || normalizedError?.code, normalizedError?.status));
      errorPanel.hidden = false;
      content.hidden = true;
      emitPlannerContext(null, null);
    } finally {
      if (revision === aiRequestRevision) {
        aiRequestController = null;
        generateButton.disabled = false;
        document.getElementById("plannerAiRetry").disabled = false;
      }
    }
  }

  function allocationPercents() {
    const industry = document.getElementById("industry").value;
    const goal = document.getElementById("goal").value;
    let percentages = [40, 25, 20, 15];
    if (industry === "food") percentages = [35, 25, 25, 15];
    if (industry === "service" || industry === "education") percentages = [35, 15, 30, 20];
    if (industry === "fashion") percentages = [40, 30, 15, 15];
    if (goal === "awareness") percentages = [45, 25, 15, 15];
    if (goal === "leads") percentages = [30, 25, 25, 20];
    if (goal === "sales") percentages = [30, 30, 20, 20];
    return percentages;
  }

  function getPriorityKeys(goal, industry, channels, audience) {
    const keys = [];
    if (channels === "none") keys.push("planner.priority.channel.none");
    else if (channels === "social") keys.push("planner.priority.channel.social");
    else keys.push("planner.priority.channel.other");

    const audienceKeys = {
      students: "planner.priority.audience.students",
      "young-professionals": "planner.priority.audience.professionals",
      "local-community": "planner.priority.audience.community",
      families: "planner.priority.audience.families",
      businesses: "planner.priority.audience.businesses",
      general: "planner.priority.audience.general"
    };
    if (audienceKeys[audience]) keys.push(audienceKeys[audience]);

    if (industry === "food") keys.push("planner.priority.industry.food");
    else if (industry === "fashion") keys.push("planner.priority.industry.fashion");
    else if (industry === "service") keys.push("planner.priority.industry.service");
    else keys.push("planner.priority.industry.general");

    if (goal === "awareness") keys.push("planner.priority.goal.awareness");
    else if (goal === "engagement") keys.push("planner.priority.goal.engagement");
    else if (goal === "leads") keys.push("planner.priority.goal.leads");
    else keys.push("planner.priority.goal.sales");

    keys.push("planner.priority.review");
    return keys;
  }

  function renderAllocations(percentages, amount) {
    const labels = [
      "planner.allocation.content",
      "planner.allocation.promotion",
      "planner.allocation.research",
      "planner.allocation.reserve"
    ];
    const allocation = document.getElementById("allocation");
    allocation.replaceChildren();

    labels.forEach((key, index) => {
      const row = document.createElement("div");
      row.className = "alloc-row";
      const label = document.createElement("span");
      label.textContent = i18n.t(key);
      const track = document.createElement("div");
      track.className = "alloc-track";
      const fill = document.createElement("div");
      fill.className = "alloc-fill";
      fill.style.width = `${percentages[index]}%`;
      track.append(fill);
      const value = document.createElement("span");
      value.className = "alloc-amount";
      value.textContent = money(amount * percentages[index] / 100);
      row.append(label, track, value);
      allocation.append(row);
    });
  }

  function updatePlan() {
    const amount = Number(budget.value);
    const percentages = allocationPercents();
    const goal = document.getElementById("goal").value;
    const industry = document.getElementById("industry").value;
    const channels = document.getElementById("channels").value;
    const audience = document.getElementById("audience").value;

    document.getElementById("budgetDisplay").textContent = money(amount);
    document.getElementById("resultBudget").textContent = money(amount);
    renderAllocations(percentages, amount);

    const metricKeys = {
      awareness: "planner.metric.awareness",
      engagement: "planner.metric.engagement",
      leads: "planner.metric.leads",
      sales: "planner.metric.sales"
    };
    document.getElementById("kpiMetric").textContent = i18n.t(metricKeys[goal]);
    document.getElementById("kpiTest").textContent = i18n.t("planner.kpi.duration");

    const introKey = amount <= 500000
      ? "planner.result.intro.small"
      : amount <= 2000000
        ? "planner.result.intro.medium"
        : "planner.result.intro.large";
    const titleKey = amount <= 500000
      ? "planner.result.title.small"
      : amount <= 2000000
        ? "planner.result.title.medium"
        : "planner.result.title.large";
    document.getElementById("resultIntro").textContent = i18n.t(introKey);
    document.getElementById("resultTitle").textContent = i18n.t(titleKey);
    document.querySelector(".result-panel .notice").textContent = i18n.t("planner.notice");

    currentPriorityKeys = getPriorityKeys(goal, industry, channels, audience);
    const priorityList = document.getElementById("priorityList");
    priorityList.replaceChildren();
    currentPriorityKeys.forEach((key, index) => {
      const item = document.createElement("div");
      item.className = "priority";
      const number = document.createElement("b");
      number.textContent = String(index + 1).padStart(2, "0");
      const text = document.createElement("span");
      text.textContent = i18n.t(key);
      item.append(number, text);
      priorityList.append(item);
    });
  }

  function buildPlanSummary() {
    const amount = Number(budget.value);
    const percentages = allocationPercents();
    const valueOrNotProvided = (value) => value.trim() || i18n.t("planSummary.notProvided");
    const name = valueOrNotProvided(document.getElementById("startupName").value);
    const product = valueOrNotProvided(document.getElementById("product").value);
    const selectedLabels = {
      industry: {
        product: "planner.industry.product",
        food: "planner.industry.food",
        service: "planner.industry.services",
        education: "planner.industry.education",
        fashion: "planner.industry.fashion",
        tech: "planner.industry.technology"
      },
      audience: {
        students: "planner.audience.students",
        "young-professionals": "planner.audience.professionals",
        "local-community": "planner.audience.community",
        families: "planner.audience.families",
        businesses: "planner.audience.businesses",
        general: "planner.audience.general"
      },
      goal: {
        awareness: "planner.goal.awareness",
        engagement: "planner.goal.engagement",
        leads: "planner.goal.leads",
        sales: "planner.goal.sales"
      },
      channels: {
        none: "planner.channels.none",
        social: "planner.channels.social",
        marketplace: "planner.channels.marketplace",
        mixed: "planner.channels.mixed"
      }
    };
    const selectLabel = (id) => {
      const select = document.getElementById(id);
      const key = selectedLabels[id]?.[select.value];
      return key ? i18n.t(key) : i18n.t("planSummary.notProvided");
    };
    const labels = [
      "planner.allocation.content",
      "planner.allocation.promotion",
      "planner.allocation.research",
      "planner.allocation.reserve"
    ];
    const allocation = labels.map((key, index) =>
      `${i18n.t(key)}: ${money(amount * percentages[index] / 100)} (${percentages[index]}%)`
    );
    const priorities = currentPriorityKeys.map((key, index) =>
      `${index + 1}. ${i18n.t(key)}`
    );

    return [
      i18n.t("planSummary.title"),
      `${i18n.t("planSummary.startup")}: ${name}`,
      `${i18n.t("planSummary.offer")}: ${product}`,
      `${i18n.t("planSummary.industry")}: ${selectLabel("industry")}`,
      `${i18n.t("planSummary.audience")}: ${selectLabel("audience")}`,
      `${i18n.t("planSummary.monthlyBudget")}: ${money(amount)}`,
      `${i18n.t("planSummary.goal")}: ${selectLabel("goal")}`,
      `${i18n.t("planSummary.channels")}: ${selectLabel("channels")}`,
      "",
      `${i18n.t("planSummary.allocationTitle")}:`,
      ...allocation,
      "",
      `${i18n.t("planSummary.firstTest")}: ${i18n.t("planner.kpi.duration")}`,
      `${i18n.t("planSummary.primaryMetric")}: ${i18n.t({
        awareness: "planner.metric.awareness",
        engagement: "planner.metric.engagement",
        leads: "planner.metric.leads",
        sales: "planner.metric.sales"
      }[document.getElementById("goal").value])}`,
      "",
      `${i18n.t("planSummary.priorities")}:`,
      ...priorities,
      "",
      `${i18n.t("planSummary.disclaimer")}: ${i18n.t("planner.notice")}`
    ].join("\n");
  }

  async function copySummary() {
    const summary = buildPlanSummary();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summary);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      window.Growise.toast(i18n.t("planner.copy.success"));
    } catch (error) {
      const textArea = document.createElement("textarea");
      textArea.value = summary;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.append(textArea);
      textArea.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (fallbackError) {
        copied = false;
      }
      textArea.remove();
      window.Growise.toast(i18n.t(copied ? "planner.copy.success" : "planner.copy.failure"));
    }
  }

  function downloadSummary() {
    let url = "";
    let link;
    try {
      const blob = new Blob([buildPlanSummary()], { type: "text/plain;charset=utf-8" });
      url = URL.createObjectURL(blob);
      link = document.createElement("a");
      link.href = url;
      link.download = `${i18n.t("planSummary.filename")}.txt`;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      window.Growise.toast(i18n.t("planner.download.success"));
    } catch (error) {
      link?.remove();
      if (url) URL.revokeObjectURL(url);
      window.Growise.toast(i18n.t("planner.download.failure"));
    }
  }

  budget.addEventListener("input", () => {
    updatePlan();
    invalidateAiPlan();
  });
  ["industry", "goal", "channels", "audience"].forEach((id) =>
    document.getElementById(id).addEventListener("change", () => {
      updatePlan();
      invalidateAiPlan();
    })
  );
  ["startupName", "product"].forEach((id) =>
    document.getElementById(id).addEventListener("input", invalidateAiPlan)
  );
  document.getElementById("generatePlan").addEventListener("click", () => {
    updatePlan();
    window.Growise.toast(i18n.t("planner.generate.toast"));
    document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    requestAiPlan();
  });
  document.getElementById("plannerAiRetry").addEventListener("click", requestAiPlan);
  document.getElementById("copyPlan").addEventListener("click", copySummary);
  document.getElementById("downloadPlan").addEventListener("click", downloadSummary);
  document.addEventListener("growise:localechange", () => {
    updatePlan();
    invalidateAiPlan();
  });

  updatePlan();
})();
