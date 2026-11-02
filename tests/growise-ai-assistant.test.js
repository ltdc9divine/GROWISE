const test = require("node:test");
const assert = require("node:assert/strict");
let AssistantRequestError;
let createRateLimiter;
let getClientAddress;
let handleAssistantRequest;

test.before(async () => {
  ({
    AssistantRequestError,
    createRateLimiter,
    getClientAddress,
    handleAssistantRequest
  } = await import("../supabase/functions/growise-ai-assistant/core.mjs"));
});

const allowedOrigin = "https://growise-five.vercel.app";
const testApiKey = "mock-groq-key-for-tests-only";
const testModel = "openai/gpt-oss-20b";

function request(body, options = {}) {
  return new Request("https://project.supabase.co/functions/v1/growise-ai-assistant", {
    method: options.method || "POST",
    headers: {
      Origin: options.origin || allowedOrigin,
      "Content-Type": "application/json",
      "x-forwarded-for": options.ip || "192.0.2.10"
    },
    body: options.method === "GET" ? undefined : JSON.stringify(body)
  });
}

function groqReply(content, status = 200, headers = {}) {
  return new Response(JSON.stringify({
    choices: [{ message: { content }, finish_reason: "stop" }]
  }), { status, headers });
}

function dependencies(options = {}) {
  return {
    env: options.env || {
      GROQ_API_KEY: testApiKey,
      GROQ_MODEL: testModel
    },
    fetcher: options.fetcher || (async () => groqReply("A practical next step.")),
    isAllowedOrigin: (origin) => origin === allowedOrigin,
    jsonResponse: (_request, body, status) => new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" }
    }),
    consumeRateLimit: options.consumeRateLimit || (() => ({ allowed: true, retryAfterSeconds: 0 })),
    getClientIdentifier: options.getClientIdentifier
      || (async (incomingRequest) => getClientAddress(incomingRequest)),
    timeoutMs: options.timeoutMs
  };
}

function userMessage(text = "How should I market my student startup?") {
  return { messages: [{ role: "user", text }] };
}

function exactAmounts(total, percentages) {
  const amounts = percentages.map((percentage) => Math.floor(total * percentage / 100));
  let remainder = total - amounts.reduce((sum, amount) => sum + amount, 0);
  const order = percentages
    .map((percentage, index) => ({ index, fraction: (total * percentage) % 100 }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);
  for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
    amounts[order[index % order.length].index] += 1;
  }
  return amounts;
}

function budgetPlanRequest(options = {}) {
  const amount = options.budget || 1_000_000;
  const percentages = [40, 25, 20, 15];
  const amounts = exactAmounts(amount, percentages);
  return request({
    mode: "budget_plan",
    plan: {
      startupName: "Demo Bakery",
      product: "Handmade cakes",
      industry: "food",
      audience: "students",
      budget: amount,
      objective: "awareness",
      channels: "social",
      locale: "en",
      baselineAllocations: ["content", "promotion", "research", "reserve"].map(
        (category, index) => ({
          category,
          percentage: percentages[index],
          amount: amounts[index]
        })
      )
    }
  });
}

function validBudgetPlan(overrides = {}) {
  return {
    allocations: [
      { activity: "Create short-form content", percentage: 33, rationale: "Reuse product stories.", objective: "Build awareness." },
      { activity: "Small content test", percentage: 33, rationale: "Compare two messages.", objective: "Learn what resonates." },
      { activity: "Customer interviews", percentage: 34, rationale: "Hear customer feedback.", objective: "Improve positioning." }
    ],
    channels: [
      { name: "Social media", why: "Visual product discovery.", advantages: "Organic reach.", limitations: "Requires consistency.", lowBudgetStart: "Post three useful formats." },
      { name: "Campus groups", why: "Relevant student audience.", advantages: "Direct feedback.", limitations: "Participation varies.", lowBudgetStart: "Ask permission before sharing." }
    ],
    actionPlan: [
      { week: "Week 1", action: "Interview potential customers.", priority: 1, budgetPercentage: 25, measure: "Record repeated needs." },
      { week: "Week 2", action: "Publish two content formats.", priority: 2, budgetPercentage: 25, measure: "Compare saves and replies." },
      { week: "Week 3", action: "Run a small message test.", priority: 3, budgetPercentage: 25, measure: "Track relevant visits." },
      { week: "Week 4", action: "Review evidence and adjust.", priority: 4, budgetPercentage: 25, measure: "Document learnings." }
    ],
    kpis: [
      { name: "Relevant reach", why: "Signals exposure.", howToTrack: "Review platform insights." },
      { name: "Meaningful engagement", why: "Signals interest.", howToTrack: "Compare saves and replies." },
      { name: "Qualified inquiries", why: "Connects activity to demand.", howToTrack: "Log inquiry sources." }
    ],
    explanation: "This plan starts with low-cost learning before expanding spend.",
    assumptions: ["The team can create basic content in-house."],
    followUpQuestion: "Which product makes customers choose you?",
    ...overrides
  };
}

test("sends chat through Groq and parses its Chat Completions response", async () => {
  let call;
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async (url, init) => {
      call = { url, init };
      return groqReply("A practical answer.");
    }
  }));
  const payload = await result.json();
  const body = JSON.parse(call.init.body);

  assert.equal(result.status, 200);
  assert.equal(payload.reply, "A practical answer.");
  assert.equal(call.url, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(call.init.headers.Authorization, `Bearer ${testApiKey}`);
  assert.equal(body.model, testModel);
  assert.deepEqual(body.messages.map(({ role }) => role), ["system", "user"]);
  assert.equal(body.messages[1].content, "How should I market my student startup?");
  assert.match(body.messages[0].content, /Do not invent market facts/);
  assert.equal(body.max_completion_tokens, 700);
  assert.equal(JSON.stringify(payload).includes(testApiKey), false);
});

test("preserves multi-turn chat history as user and assistant messages", async () => {
  let sentMessages;
  const result = await handleAssistantRequest(request({
    messages: [
      { role: "user", text: "My budget is limited." },
      { role: "model", text: "Which customers are you targeting?" },
      { role: "user", text: "HUFLIT students." }
    ]
  }), dependencies({
    fetcher: async (_url, init) => {
      sentMessages = JSON.parse(init.body).messages;
      return groqReply("Try a small campus test.");
    }
  }));

  assert.equal(result.status, 200);
  assert.deepEqual(sentMessages.map(({ role }) => role), ["system", "user", "assistant", "user"]);
});

test("rejects a chat response truncated at Groq's completion-token limit", async () => {
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async () => new Response(JSON.stringify({
      choices: [{
        message: { content: "An incomplete answer" },
        finish_reason: "length"
      }]
    }), { status: 200 })
  }));
  const payload = await result.json();

  assert.equal(result.status, 502);
  assert.equal(payload.error, "invalid_response");
});

test("enforces origin, method, input shape, message length, and conversation limits", async () => {
  const originResult = await handleAssistantRequest(
    request(userMessage(), { origin: "https://untrusted.example" }),
    dependencies()
  );
  const methodResult = await handleAssistantRequest(
    request({}, { method: "GET" }),
    dependencies()
  );
  const extraFieldResult = await handleAssistantRequest(
    request({ ...userMessage(), consultation: "private details" }),
    dependencies()
  );
  const longMessageResult = await handleAssistantRequest(
    request(userMessage("x".repeat(2001))),
    dependencies()
  );
  const tooManyMessages = Array.from({ length: 12 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "model",
    text: "Context"
  }));
  const historyResult = await handleAssistantRequest(
    request({ messages: tooManyMessages }),
    dependencies()
  );

  assert.equal(originResult.status, 403);
  assert.equal(methodResult.status, 405);
  assert.equal(extraFieldResult.status, 400);
  assert.equal((await longMessageResult.json()).error, "message_too_long");
  assert.equal(historyResult.status, 400);
});

test("returns a validated plan with exact VND allocations and Groq JSON mode", async () => {
  const amount = 201_001;
  let sentBody;
  const result = await handleAssistantRequest(budgetPlanRequest({ budget: amount }), dependencies({
    fetcher: async (_url, init) => {
      sentBody = JSON.parse(init.body);
      return groqReply(JSON.stringify(validBudgetPlan()));
    }
  }));
  const payload = await result.json();
  const plan = payload.plan;

  assert.equal(result.status, 200);
  assert.equal(plan.budget, amount);
  assert.equal(plan.allocations.reduce((sum, item) => sum + item.amount, 0), amount);
  assert.equal(plan.actionPlan.reduce((sum, item) => sum + item.budgetAmount, 0), amount);
  assert.deepEqual(
    plan.allocations.map(({ amount: allocationAmount }) => allocationAmount),
    exactAmounts(amount, [33, 33, 34])
  );
  assert.deepEqual(plan.actionPlan.map(({ budgetAmount }) => budgetAmount), exactAmounts(amount, [25, 25, 25, 25]));
  assert.equal(sentBody.model, testModel);
  assert.equal(sentBody.response_format.type, "json_object");
  assert.equal(sentBody.max_completion_tokens, 3000);
  assert.deepEqual(sentBody.messages.map(({ role }) => role), ["system", "user"]);
  assert.match(sentBody.messages[0].content, /Do not include money amounts/);
  assert.equal(JSON.stringify(payload).includes(testApiKey), false);
});

test("reconciles allocation math for minimum and maximum planner budgets", async () => {
  for (const amount of [200_000, 10_000_000]) {
    const result = await handleAssistantRequest(budgetPlanRequest({ budget: amount }), dependencies({
      fetcher: async () => groqReply(JSON.stringify(validBudgetPlan()))
    }));
    const payload = await result.json();
    assert.equal(result.status, 200);
    assert.equal(payload.plan.allocations.reduce((sum, item) => sum + item.amount, 0), amount);
    assert.ok(payload.plan.allocations.every((item) => item.amount <= amount));
    assert.equal(payload.plan.actionPlan.reduce((sum, item) => sum + item.budgetAmount, 0), amount);
  }
});

test("rejects incomplete planner inputs and inconsistent baseline math before calling Groq", async () => {
  let called = false;
  const missingBody = await budgetPlanRequest().json();
  delete missingBody.plan.industry;
  const missing = await handleAssistantRequest(request(missingBody), dependencies({
    fetcher: async () => {
      called = true;
      return groqReply("{}");
    }
  }));
  const invalidBody = await budgetPlanRequest().json();
  invalidBody.plan.baselineAllocations[0].amount += 1;
  const wrongBaseline = await handleAssistantRequest(request(invalidBody), dependencies({
    fetcher: async () => {
      called = true;
      return groqReply("{}");
    }
  }));

  assert.equal(missing.status, 400);
  assert.equal(wrongBaseline.status, 400);
  assert.equal(called, false);
});

test("accepts older planner clients without baseline allocations and ignores extra fields", async () => {
  const body = await budgetPlanRequest({ budget: 1_100_000 }).json();
  delete body.plan.baselineAllocations;
  body.plan.futureClientField = "must not be forwarded";
  body.unused = "must not be forwarded";
  let prompt;
  const result = await handleAssistantRequest(request(body), dependencies({
    fetcher: async (_url, init) => {
      prompt = JSON.parse(init.body).messages[1].content;
      return groqReply(JSON.stringify(validBudgetPlan()));
    }
  }));
  const payload = await result.json();

  assert.equal(result.status, 200);
  assert.equal(payload.plan.budget, 1_100_000);
  assert.match(prompt, /Existing planner calculation/);
  assert.match(prompt, /"percentage":45/);
  assert.equal(prompt.includes("must not be forwarded"), false);
});

test("rejects malformed or incomplete Groq planner JSON", async () => {
  const malformed = await handleAssistantRequest(budgetPlanRequest(), dependencies({
    fetcher: async () => groqReply("{not json")
  }));
  const missingField = await handleAssistantRequest(budgetPlanRequest(), dependencies({
    fetcher: async () => groqReply(JSON.stringify(validBudgetPlan({ channels: [] })))
  }));
  const wrongTotal = validBudgetPlan({
    allocations: validBudgetPlan().allocations.map((item, index) => ({
      ...item,
      percentage: index === 0 ? item.percentage + 1 : item.percentage
    }))
  });
  const invalidPercentages = await handleAssistantRequest(budgetPlanRequest(), dependencies({
    fetcher: async () => groqReply(JSON.stringify(wrongTotal))
  }));

  assert.equal((await malformed.json()).error, "invalid_ai_plan");
  assert.equal((await missingField.json()).error, "invalid_ai_plan");
  assert.equal((await invalidPercentages.json()).error, "invalid_ai_plan");
});

test("reports the supported model list when the configured model is unavailable", async () => {
  let calls = 0;
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async (url) => {
      calls += 1;
      if (url.endsWith("/models")) {
        return new Response(JSON.stringify({
          data: [{ id: "openai/gpt-oss-20b" }, { id: "llama-3.3-70b-versatile" }]
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: { message: "model not found" } }), { status: 404 });
    }
  }));
  const payload = await result.json();

  assert.equal(result.status, 503);
  assert.equal(payload.error, "model_unavailable");
  assert.deepEqual(payload.models, ["llama-3.3-70b-versatile"]);
  assert.equal(calls, 2);
});

test("maps authentication, malformed-request, and server failures to distinct errors", async () => {
  for (const [status, error] of [
    [401, "groq_credentials_invalid"],
    [403, "groq_credentials_invalid"],
    [400, "groq_bad_request"],
    [500, "model_temporarily_unavailable"]
  ]) {
    const result = await handleAssistantRequest(request(userMessage()), dependencies({
      fetcher: async (url) => {
        if (url.endsWith("/models")) {
          return new Response(JSON.stringify({ data: [] }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: { message: "upstream detail" } }), { status });
      }
    }));
    const payload = await result.json();
    assert.equal(result.status, status >= 500 ? 503 : status === 400 ? 400 : 503);
    assert.equal(payload.error, error);
    assert.equal(JSON.stringify(payload).includes("upstream detail"), false);
  }
});

test("does not retry or list models on Groq quota errors and returns safe rate-limit metadata", async () => {
  let calls = 0;
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async () => {
      calls += 1;
      return new Response(JSON.stringify({ error: { message: "quota" } }), {
        status: 429,
        headers: {
          "x-ratelimit-remaining-requests": "0",
          "x-ratelimit-reset-requests": "2s"
        }
      });
    }
  }));
  const payload = await result.json();

  assert.equal(result.status, 429);
  assert.equal(payload.error, "quota_exceeded");
  assert.deepEqual(payload.rateLimit, { requestsRemaining: "0", requestsReset: "2s" });
  assert.equal(calls, 1);
});

test("handles timeout and network failure without leaking provider details", async () => {
  const timeout = await handleAssistantRequest(request(userMessage()), dependencies({
    timeoutMs: 5,
    fetcher: (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    })
  }));
  const network = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async () => {
      throw new Error(`network failure ${testApiKey}`);
    }
  }));

  assert.equal(timeout.status, 504);
  assert.equal((await timeout.json()).error, "request_timeout");
  assert.equal(network.status, 502);
  assert.equal(JSON.stringify(await network.json()).includes(testApiKey), false);
});

test("times out while reading a stalled Groq response body", async () => {
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    timeoutMs: 5,
    fetcher: (_url, init) => Promise.resolve({
      ok: true,
      status: 200,
      json: () => new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      })
    })
  }));

  assert.equal(result.status, 504);
  assert.equal((await result.json()).error, "request_timeout");
});

test("reports missing config and invalid model names without calling Groq", async () => {
  let calls = 0;
  const missing = await handleAssistantRequest(request(userMessage()), dependencies({
    env: {},
    fetcher: async () => {
      calls += 1;
      return groqReply("unexpected");
    }
  }));
  const invalidModel = await handleAssistantRequest(request(userMessage()), dependencies({
    env: { GROQ_API_KEY: testApiKey, GROQ_MODEL: "../invalid" },
    fetcher: async () => {
      calls += 1;
      return groqReply("unexpected");
    }
  }));

  assert.equal((await missing.json()).error, "service_not_configured");
  assert.equal((await invalidModel.json()).error, "model_not_configured");
  assert.equal(calls, 0);
});

test("enforces per-client rate limits without persisting client addresses", () => {
  let now = 100;
  const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => now });
  assert.equal(limiter.consume("hashed-client").allowed, true);
  assert.equal(limiter.consume("hashed-client").allowed, true);
  assert.deepEqual(limiter.consume("hashed-client"), {
    allowed: false,
    retryAfterSeconds: 60
  });
  now += 60_000;
  assert.equal(limiter.consume("hashed-client").allowed, true);

  const noAddress = new Request("https://example.test", { headers: { Origin: allowedOrigin } });
  assert.equal(getClientAddress(noAddress), null);
});

test("does not send API keys or private data in successful client responses", async () => {
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async () => groqReply("Xin chào! Hãy bắt đầu bằng việc tìm hiểu khách hàng.")
  }));
  const body = await result.text();

  assert.match(body, /Xin chào/);
  assert.equal(body.includes(testApiKey), false);
  assert.equal(body.includes("student records"), false);
});
