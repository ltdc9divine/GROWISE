(function () {
  const i18n = window.Growise.i18n;
  const budget = document.getElementById("budget");
  let currentPriorityKeys = [];

  function money(amount) {
    const locale = i18n.getLocale() === "vi" ? "vi-VN" : "en-US";
    return `${Math.round(amount).toLocaleString(locale)} ₫`;
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

  budget.addEventListener("input", updatePlan);
  ["industry", "goal", "channels", "audience"].forEach((id) =>
    document.getElementById(id).addEventListener("change", updatePlan)
  );
  document.getElementById("generatePlan").addEventListener("click", () => {
    updatePlan();
    window.Growise.toast(i18n.t("planner.generate.toast"));
    document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("copyPlan").addEventListener("click", copySummary);
  document.getElementById("downloadPlan").addEventListener("click", downloadSummary);
  document.addEventListener("growise:localechange", updatePlan);

  updatePlan();
})();
