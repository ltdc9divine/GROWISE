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

  function getPriorityKeys(goal, industry, channels) {
    const keys = [];
    if (channels === "none") keys.push("planner.priority.channel.none");
    else if (channels === "social") keys.push("planner.priority.channel.social");
    else keys.push("planner.priority.channel.other");

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

    currentPriorityKeys = getPriorityKeys(goal, industry, channels);
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
    const name = document.getElementById("startupName").value.trim()
      || i18n.t("planSummary.defaultStartup");
    const product = document.getElementById("product").value.trim()
      || i18n.t("planSummary.defaultOffer");
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
      `${i18n.t("planSummary.monthlyBudget")}: ${money(amount)}`,
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
      i18n.t("planSummary.note")
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
    try {
      const blob = new Blob([buildPlanSummary()], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${i18n.t("planSummary.filename")}.txt`;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      window.Growise.toast(i18n.t("planner.download.success"));
    } catch (error) {
      window.Growise.toast(i18n.t("common.downloadFailure"));
    }
  }

  budget.addEventListener("input", updatePlan);
  ["industry", "goal", "channels"].forEach((id) =>
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
