(function () {
  function createClient(config, options = {}) {
    const fetchImpl = options.fetch || window.fetch.bind(window);
    const baseUrl = config?.url?.replace(/\/+$/, "");

    return {
      async load(session, params = {}) {
        if (!baseUrl || !config?.publishableKey) {
          throw new Error("dashboard_not_configured");
        }
        if (!session?.access_token) throw new Error("dashboard_unauthorized");

        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value));
          }
        });
        const response = await fetchImpl(
          `${baseUrl}/functions/v1/admin-dashboard-data?${query}`,
          {
            method: "GET",
            headers: {
              apikey: config.publishableKey,
              Authorization: `Bearer ${session.access_token}`
            },
            cache: "no-store"
          }
        );
        let payload;
        try {
          payload = await response.json();
        } catch {
          throw new Error("dashboard_response_invalid");
        }
        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : "dashboard_request_failed"
          );
        }
        return payload;
      }
    };
  }

  const i18n = window.Growise.i18n;
  const pageSize = 10;
  const exportPageSize = 50;
  const ratingFields = [
    ["overall_rating", "adminDashboard.rating.overall"],
    ["usability_rating", "adminDashboard.rating.usability"],
    ["usefulness_rating", "adminDashboard.rating.usefulness"],
    ["marketing_rating", "adminDashboard.rating.marketing"],
    ["planner_rating", "adminDashboard.rating.planner"],
    ["resources_rating", "adminDashboard.rating.resources"],
    ["assistant_rating", "adminDashboard.rating.assistant"]
  ];
  const industries = {
    food_beverage: "consultation.industry.food",
    fashion_beauty: "consultation.industry.fashion",
    education: "consultation.industry.education",
    consumer_products: "consultation.industry.consumer",
    services: "consultation.industry.services",
    technology: "consultation.industry.tech",
    other: "consultation.industry.other"
  };
  const budgets = {
    undecided: "consultation.budget.undecided",
    under_500000: "consultation.budget.under500",
    vnd_500000_1000000: "consultation.budget.500to1m",
    vnd_1000000_3000000: "consultation.budget.1to3m",
    vnd_3000000_5000000: "consultation.budget.3to5m",
    over_5000000: "consultation.budget.over5m"
  };
  const methods = {
    online: "consultation.method.online",
    in_person: "consultation.method.inPerson",
    email_first: "consultation.method.email"
  };
  const times = {
    flexible: "consultation.time.flexible",
    morning: "consultation.time.morning",
    afternoon: "consultation.time.afternoon",
    evening: "consultation.time.evening"
  };

  let client = null;
  let currentSession = null;
  let section = "overview";
  let page = 1;
  let lastResult = null;
  let loading = false;
  let exporting = false;
  let exportRevision = 0;
  let requestRevision = 0;
  let initialized = false;

  function element(id) {
    return document.getElementById(id);
  }

  function makeText(tagName, text, className) {
    const node = document.createElement(tagName);
    node.textContent = text ?? "";
    if (className) node.className = className;
    return node;
  }

  function toCsv(rows) {
    return rows.map((row) => row.map((value) => {
      let text = value === null || value === undefined ? "" : String(value);
      if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    }).join(",")).join("\r\n");
  }

  function exportRows(recordSection, records) {
    const columns = {
      students: [
        ["adminDashboard.recordId", "id"],
        ["adminDashboard.fullName", "full_name"],
        ["adminDashboard.username", "username"],
        ["adminDashboard.studentId", "student_id"],
        ["adminDashboard.createdAt", "created_at"],
        ["adminDashboard.updatedAt", "updated_at"]
      ],
      consultations: [
        ["adminDashboard.recordId", "id"],
        ["adminDashboard.fullName", "full_name"],
        ["adminDashboard.email", "email"],
        ["adminDashboard.startup", "startup_name"],
        ["adminDashboard.industry", "industry"],
        ["adminDashboard.budget", "monthly_budget"],
        ["adminDashboard.method", "preferred_method"],
        ["adminDashboard.preferredDate", "preferred_date"],
        ["adminDashboard.preferredTime", "preferred_time"],
        ["adminDashboard.challenge", "challenge"],
        ["adminDashboard.createdAt", "created_at"]
      ],
      feedback: [
        ["adminDashboard.recordId", "id"],
        ["adminDashboard.sender", "sender_name"],
        ...ratingFields.map(([field, labelKey]) => [labelKey, field]),
        ["adminDashboard.liked", "liked"],
        ["adminDashboard.improve", "improve"],
        ["adminDashboard.requestedFeatures", "requested_features"],
        ["adminDashboard.createdAt", "created_at"]
      ]
    }[recordSection];
    if (!columns) throw new Error("dashboard_export_section_invalid");

    const headers = columns.map(([labelKey]) => i18n.t(labelKey));
    const rows = records.map((record) => columns.map(([, field]) => (
      field === "sender_name"
        ? record.sender_name || i18n.t("adminDashboard.anonymous")
        : record[field]
    )));
    return [headers, ...rows];
  }

  function dateText(value) {
    if (!value) return i18n.t("adminDashboard.notAvailable");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return i18n.t("adminDashboard.notAvailable");
    return new Intl.DateTimeFormat(
      i18n.getLocale() === "vi" ? "vi-VN" : "en-US",
      { dateStyle: "medium", timeStyle: "short" }
    ).format(date);
  }

  function appendDefinitionList(container, fields) {
    const list = document.createElement("dl");
    list.className = "admin-dashboard-details";
    fields.forEach(([labelKey, value]) => {
      const wrapper = document.createElement("div");
      wrapper.append(
        makeText("dt", i18n.t(labelKey)),
        makeText("dd", value ?? i18n.t("adminDashboard.notAvailable"))
      );
      list.append(wrapper);
    });
    container.append(list);
  }

  function renderSummary(summary) {
    const container = element("adminDashboardSummary");
    container.replaceChildren();
    if (!summary) return;
    [
      ["adminDashboard.totalStudents", summary.students],
      ["adminDashboard.totalConsultations", summary.consultations],
      ["adminDashboard.totalFeedback", summary.feedback]
    ].forEach(([labelKey, count]) => {
      const card = document.createElement("article");
      card.className = "admin-dashboard-stat";
      card.append(
        makeText("span", i18n.t(labelKey)),
        makeText("strong", String(count ?? 0))
      );
      container.append(card);
    });

    const averages = summary.averages || {};
    const averageCard = document.createElement("article");
    averageCard.className = "admin-dashboard-stat admin-dashboard-stat-wide";
    averageCard.append(
      makeText("span", i18n.t("adminDashboard.averageRatings")),
      makeText(
        "p",
        i18n.t("adminDashboard.averageSample", {
          count: summary.feedback ?? 0
        })
      )
    );
    const averageGrid = document.createElement("div");
    averageGrid.className = "admin-dashboard-average-grid";
    ratingFields.forEach(([field, labelKey]) => {
      const average = averages[field];
      averageGrid.append(
        makeText(
          "span",
          `${i18n.t(labelKey)}: ${average === null || average === undefined
            ? i18n.t("adminDashboard.notAvailable")
            : Number(average).toFixed(2)}`
        )
      );
    });
    averageCard.append(averageGrid);
    container.append(averageCard);
    if (Array.isArray(summary.consultations_by_industry)) {
      container.append(renderIndustryStats(summary.consultations_by_industry));
    }
    if (Array.isArray(summary.activity_by_month)) {
      container.append(renderActivityStats(summary.activity_by_month));
    }
  }

  function consultationValue(value, map) {
    return map[value] ? i18n.t(map[value]) : value;
  }

  function monthText(value) {
    const date = new Date(`${value}-01T00:00:00.000Z`);
    return new Intl.DateTimeFormat(
      i18n.getLocale() === "vi" ? "vi-VN" : "en-US",
      { month: "short", year: "numeric", timeZone: "UTC" }
    ).format(date);
  }

  function renderIndustryStats(rows) {
    const card = document.createElement("article");
    card.className = "admin-dashboard-stat admin-dashboard-stat-wide";
    card.append(makeText("strong", i18n.t("adminDashboard.industryStats")));
    const max = Math.max(1, ...rows.map((row) => row.count));
    const list = document.createElement("div");
    list.className = "admin-dashboard-bars";
    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "admin-dashboard-bar-item";
      const labelKey = industries[row.industry];
      const label = labelKey
        ? i18n.t(labelKey)
        : i18n.t("adminDashboard.notAvailable");
      const heading = document.createElement("div");
      heading.className = "admin-dashboard-bar-heading";
      heading.append(
        makeText("span", label),
        makeText("strong", String(row.count))
      );
      const track = document.createElement("div");
      track.className = "admin-dashboard-bar-track";
      const bar = document.createElement("span");
      bar.style.width = `${Math.max(0, (row.count / max) * 100)}%`;
      track.append(bar);
      item.append(heading, track);
      list.append(item);
    });
    card.append(list);
    return card;
  }

  function renderActivityStats(rows) {
    const card = document.createElement("article");
    card.className = "admin-dashboard-stat admin-dashboard-stat-wide";
    card.append(makeText("strong", i18n.t("adminDashboard.activityStats")));
    const table = document.createElement("div");
    table.className = "admin-dashboard-activity";
    const header = document.createElement("div");
    header.className = "admin-dashboard-activity-row admin-dashboard-activity-header";
    [
      "adminDashboard.month",
      "adminDashboard.students",
      "adminDashboard.consultations",
      "adminDashboard.feedback"
    ].forEach((key) => header.append(makeText("span", i18n.t(key))));
    table.append(header);
    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "admin-dashboard-activity-row";
      item.append(
        makeText("span", monthText(row.month)),
        makeText("span", String(row.students)),
        makeText("span", String(row.consultations)),
        makeText("span", String(row.feedback))
      );
      table.append(item);
    });
    card.append(table);
    return card;
  }

  function renderStudent(record) {
    const article = document.createElement("article");
    article.className = "admin-dashboard-record";
    article.append(
      makeText("h4", record.full_name),
      makeText("p", `${i18n.t("adminDashboard.username")}: ${record.username}`),
      makeText("p", `${i18n.t("adminDashboard.studentId")}: ${record.student_id}`),
      makeText("p", `${i18n.t("adminDashboard.createdAt")}: ${dateText(record.created_at)}`),
      makeText("p", `${i18n.t("adminDashboard.updatedAt")}: ${dateText(record.updated_at)}`)
    );
    const details = document.createElement("details");
    details.append(makeText("summary", i18n.t("adminDashboard.viewDetails")));
    appendDefinitionList(details, [
      ["adminDashboard.recordId", record.id],
      ["adminDashboard.createdAt", dateText(record.created_at)],
      ["adminDashboard.updatedAt", dateText(record.updated_at)]
    ]);
    article.append(details);
    return article;
  }

  function renderConsultation(record) {
    const article = document.createElement("article");
    article.className = "admin-dashboard-record";
    article.append(
      makeText("h4", record.full_name),
      makeText("p", record.email),
      makeText(
        "p",
        `${i18n.t("adminDashboard.startup")}: ${record.startup_name
          || i18n.t("adminDashboard.notAvailable")}`
      )
    );
    const details = document.createElement("details");
    details.append(makeText("summary", i18n.t("adminDashboard.viewDetails")));
    appendDefinitionList(details, [
      ["adminDashboard.recordId", record.id],
      ["adminDashboard.email", record.email],
      ["adminDashboard.startup", record.startup_name],
      ["adminDashboard.industry", consultationValue(record.industry, industries)],
      ["adminDashboard.budget", consultationValue(record.monthly_budget, budgets)],
      ["adminDashboard.method", consultationValue(record.preferred_method, methods)],
      ["adminDashboard.preferredDate", record.preferred_date],
      ["adminDashboard.preferredTime", consultationValue(record.preferred_time, times)],
      ["adminDashboard.challenge", record.challenge],
      ["adminDashboard.createdAt", dateText(record.created_at)]
    ]);
    article.append(details);
    return article;
  }

  function renderFeedback(record) {
    const article = document.createElement("article");
    article.className = "admin-dashboard-record";
    article.append(
      makeText(
        "h4",
        record.sender_name || i18n.t("adminDashboard.anonymous")
      ),
      makeText("p", `${i18n.t("adminDashboard.createdAt")}: ${dateText(record.created_at)}`)
    );
    const details = document.createElement("details");
    details.append(makeText("summary", i18n.t("adminDashboard.viewDetails")));
    const ratings = ratingFields.map(([field, labelKey]) => [
      labelKey,
      `${record[field]} / 5`
    ]);
    appendDefinitionList(details, [
      ["adminDashboard.recordId", record.id],
      ...ratings,
      ["adminDashboard.liked", record.liked],
      ["adminDashboard.improve", record.improve],
      ["adminDashboard.requestedFeatures", record.requested_features]
    ]);
    article.append(details);
    return article;
  }

  function renderRecords(result) {
    const container = element("adminDashboardRecords");
    container.replaceChildren();
    if (section === "overview") {
      container.append(makeText("p", i18n.t("adminDashboard.overviewHint")));
      return;
    }
    if (!result.records?.length) {
      container.append(makeText("p", i18n.t("adminDashboard.empty"), "admin-dashboard-empty"));
      return;
    }
    const renderRecord = {
      students: renderStudent,
      consultations: renderConsultation,
      feedback: renderFeedback
    }[section];
    result.records.forEach((record) => container.append(renderRecord(record)));
  }

  function renderPagination(result) {
    const navigation = element("adminDashboardPagination");
    const totalPages = Math.max(1, Math.ceil((result.total || 0) / pageSize));
    navigation.hidden = section === "overview" || totalPages <= 1;
    element("adminDashboardPageLabel").textContent = i18n.t(
      "adminDashboard.pageOf",
      { page, pages: totalPages, total: result.total || 0 }
    );
    navigation.querySelector('[data-dashboard-page="-1"]').disabled = page <= 1;
    navigation.querySelector('[data-dashboard-page="1"]').disabled = page >= totalPages;
  }

  function render(result = lastResult) {
    document.querySelectorAll("[data-dashboard-section]").forEach((button) => {
      button.setAttribute(
        "aria-selected",
        String(button.dataset.dashboardSection === section)
      );
    });
    element("adminDashboardIndustryFilter").hidden = section !== "consultations";
    element("adminDashboardFilters").hidden = section === "overview";
    element("adminDashboardStatus").hidden = true;
    element("adminDashboardRecords").setAttribute("aria-busy", String(loading));
    const controlsDisabled = loading || exporting;
    element("adminDashboardRefresh").disabled = controlsDisabled;
    element("adminDashboardExport").hidden = section === "overview";
    element("adminDashboardExport").disabled = controlsDisabled || !(result?.total > 0);
    document.querySelectorAll("[data-dashboard-section]").forEach((button) => {
      button.disabled = controlsDisabled;
    });
    element("adminDashboardFilters").querySelectorAll("input, select, button")
      .forEach((control) => { control.disabled = controlsDisabled; });
    if (!result) {
      element("adminDashboardSummary").replaceChildren();
      element("adminDashboardRecords").replaceChildren();
      element("adminDashboardPagination").hidden = true;
      return;
    }
    renderSummary(result.summary);
    renderRecords(result);
    renderPagination(result);
    element("adminDashboardPagination").querySelectorAll("button")
      .forEach((button) => { button.disabled = controlsDisabled || button.disabled; });
  }

  function showStatus(messageKey, error = false, values = {}) {
    const status = element("adminDashboardStatus");
    status.textContent = i18n.t(messageKey, values);
    status.hidden = false;
    status.dataset.kind = error ? "error" : "info";
  }

  function requestParams() {
    const form = element("adminDashboardFilters");
    return {
      section,
      q: form.elements.q.value.trim(),
      industry: section === "consultations" ? form.elements.industry.value : "",
      from: form.elements.from.value,
      to: form.elements.to.value,
      sort: form.elements.sort.value,
      page,
      page_size: pageSize
    };
  }

  function downloadCsv(recordSection, records) {
    const csv = toCsv(exportRows(recordSection, records));
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `growise-${recordSection}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }

  async function exportRecords() {
    if (!currentSession || section === "overview" || loading || exporting) return;
    const exportSection = section;
    const revision = ++exportRevision;
    const params = { ...requestParams(), page: 1, page_size: exportPageSize };
    const session = currentSession;
    exporting = true;
    render(lastResult);
    showStatus("adminDashboard.exportLoading");
    let outcome = null;
    try {
      const firstPage = await client.load(session, params);
      if (revision !== exportRevision) return;
      const records = [...firstPage.records];
      const total = firstPage.total;
      const totalPages = Math.ceil(total / exportPageSize);
      for (let exportPage = 2; exportPage <= totalPages; exportPage += 1) {
        const result = await client.load(session, {
          ...params,
          page: exportPage
        });
        if (revision !== exportRevision) return;
        if (!result.records.length) throw new Error("dashboard_export_incomplete");
        records.push(...result.records);
      }
      if (records.length !== total) throw new Error("dashboard_export_incomplete");
      downloadCsv(exportSection, records);
      outcome = {
        message: "adminDashboard.exportSuccess",
        values: { count: records.length }
      };
    } catch {
      if (revision === exportRevision) {
        outcome = { message: "adminDashboard.exportError", error: true };
      }
    } finally {
      exporting = false;
      if (revision === exportRevision) {
        render(lastResult);
        if (outcome) showStatus(outcome.message, outcome.error, outcome.values);
      }
    }
  }

  async function refresh() {
    if (!currentSession) return;
    const revision = ++requestRevision;
    loading = true;
    render(lastResult);
    showStatus("adminDashboard.loading");
    try {
      lastResult = await client.load(currentSession, requestParams());
      if (revision !== requestRevision) return;
      const lastPage = Math.max(1, Math.ceil((lastResult.total || 0) / pageSize));
      if (page > lastPage) {
        page = lastPage;
        loading = false;
        refresh();
        return;
      }
      loading = false;
      render(lastResult);
      if (section !== "overview" && lastResult.records.length === 0) {
        showStatus("adminDashboard.empty");
      }
    } catch (error) {
      if (revision !== requestRevision) return;
      loading = false;
      lastResult = null;
      render(null);
      showStatus(
        error?.message === "dashboard_forbidden"
          ? "adminDashboard.forbidden"
          : "adminDashboard.loadError",
        true
      );
    }
  }

  function initialize(config, options) {
    if (!initialized) {
      initialized = true;
      element("adminDashboardRefresh").addEventListener("click", refresh);
      element("adminDashboardExport").addEventListener("click", exportRecords);
      element("adminDashboardFilters").addEventListener("submit", (event) => {
        event.preventDefault();
        page = 1;
        refresh();
      });
      element("adminDashboard").addEventListener("click", (event) => {
        const tab = event.target.closest("[data-dashboard-section]");
        if (tab && tab.dataset.dashboardSection !== section) {
          section = tab.dataset.dashboardSection;
          page = 1;
          refresh();
          return;
        }
        const pageButton = event.target.closest("[data-dashboard-page]");
        if (pageButton && !pageButton.disabled) {
          page += Number(pageButton.dataset.dashboardPage);
          refresh();
        }
      });
      document.addEventListener("growise:localechange", () => render());
    }
    client = createClient(config, options);
  }

  function load(session) {
    currentSession = session;
    if (element("adminDashboard").hidden) return;
    refresh();
  }

  function clear() {
    requestRevision += 1;
    exportRevision += 1;
    currentSession = null;
    lastResult = null;
    loading = false;
    exporting = false;
    page = 1;
    element("adminDashboardSummary").replaceChildren();
    element("adminDashboardRecords").replaceChildren();
    element("adminDashboardPagination").hidden = true;
    element("adminDashboardStatus").hidden = true;
  }

  window.Growise = window.Growise || {};
  window.GrowiseAdminDashboard = { createClient, initialize, load, clear, toCsv, exportRows };
})();
