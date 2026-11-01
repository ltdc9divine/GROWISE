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
const testApiKey = "mock-gemini-key-for-tests-only";

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

function dependencies(options = {}) {
  return {
    env: options.env || {
      GEMINI_API_KEY: testApiKey,
      GEMINI_MODEL: "gemini-test-flash"
    },
    fetcher: options.fetcher || (async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "A practical next step." }] } }]
    }), { status: 200 })),
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

test("sends a bounded conversation to Gemini using the API-key header", async () => {
  let call;
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async (url, init) => {
      call = { url, init };
      return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{ text: "Test" }, { text: " reply." }]
          }
        }]
      }), { status: 200 });
    }
  }));
  const payload = await result.json();
  const geminiBody = JSON.parse(call.init.body);

  assert.equal(result.status, 200);
  assert.equal(payload.reply, "Test reply.");
  assert.match(call.url, /\/v1beta\/models\/gemini-test-flash:generateContent$/);
  assert.equal(call.init.headers["x-goog-api-key"], testApiKey);
  assert.equal(geminiBody.contents[0].role, "user");
  assert.equal(geminiBody.contents[0].parts[0].text, "How should I market my student startup?");
  assert.match(geminiBody.systemInstruction.parts[0].text, /Do not invent market facts/);
  assert.equal(geminiBody.generationConfig.maxOutputTokens, 700);
  assert.equal(geminiBody.generationConfig.thinkingConfig.thinkingLevel, "MINIMAL");
  assert.equal(JSON.stringify(payload).includes(testApiKey), false);
});

test("preserves user/model roles in multi-turn conversations", async () => {
  let sentContents;
  const result = await handleAssistantRequest(request({
    messages: [
      { role: "user", text: "My budget is limited." },
      { role: "model", text: "Which customers are you targeting?" },
      { role: "user", text: "HUFLIT students." }
    ]
  }), dependencies({
    fetcher: async (_url, init) => {
      sentContents = JSON.parse(init.body).contents;
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Test response." }] } }]
      }), { status: 200 });
    }
  }));

  assert.equal(result.status, 200);
  assert.deepEqual(sentContents.map(({ role }) => role), ["user", "model", "user"]);
});

test("rejects unapproved origins, methods, extra fields, and oversized messages", async () => {
  const originResult = await handleAssistantRequest(
    request(userMessage(), { origin: "https://untrusted.example" }),
    dependencies()
  );
  const methodResult = await handleAssistantRequest(
    new Request("https://project.supabase.co/functions/v1/growise-ai-assistant", {
      method: "GET",
      headers: { Origin: allowedOrigin }
    }),
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
  const oversizedBodyResult = await handleAssistantRequest(
    request(userMessage("x".repeat(40_001))),
    dependencies()
  );

  assert.equal(originResult.status, 403);
  assert.equal(methodResult.status, 405);
  assert.equal(extraFieldResult.status, 400);
  assert.equal((await longMessageResult.json()).error, "message_too_long");
  assert.equal(oversizedBodyResult.status, 413);
});

test("returns a safe model list when the configured model is unavailable", async () => {
  const called = [];
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async (url, init) => {
      called.push({ url, init });
      if (url.includes(":generateContent")) {
        return new Response(JSON.stringify({ error: { status: "NOT_FOUND" } }), { status: 404 });
      }
      return new Response(JSON.stringify({
        models: [
          { name: "models/gemini-test-flash", supportedGenerationMethods: ["generateContent"] },
          { name: "models/gemini-compatible", supportedGenerationMethods: ["generateContent"] },
          { name: "models/embedding-only", supportedGenerationMethods: ["embedContent"] }
        ]
      }), { status: 200 });
    }
  }));
  const payload = await result.json();

  assert.equal(result.status, 503);
  assert.deepEqual(payload.models, ["gemini-compatible"]);
  assert.equal(JSON.stringify(payload).includes(testApiKey), false);
  assert.equal(called.length, 2);
  assert.equal(called[1].init.headers["x-goog-api-key"], testApiKey);
});

test("reports alternative Gemini models when the configured model is temporarily overloaded", async () => {
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    env: {
      GEMINI_API_KEY: testApiKey,
      GEMINI_MODEL: "gemini-3.8-flash"
    },
    fetcher: async (url) => {
      if (url.includes(":generateContent")) {
        return new Response(JSON.stringify({
          error: {
            status: "UNAVAILABLE",
            message: "Temporary capacity issue."
          }
        }), { status: 503 });
      }
      return new Response(JSON.stringify({
        models: [
          { name: "models/gemini-3.8-flash", supportedGenerationMethods: ["generateContent"] },
          { name: "models/gemini-3.5-flash", supportedGenerationMethods: ["generateContent"] }
        ]
      }), { status: 200 });
    }
  }));
  const payload = await result.json();

  assert.equal(result.status, 503);
  assert.equal(payload.error, "model_temporarily_unavailable");
  assert.deepEqual(payload.models, ["gemini-3.5-flash"]);
});

test("maps quota and provider failures without returning upstream error details", async () => {
  const quotaResult = await handleAssistantRequest(request(userMessage()), dependencies({
    fetcher: async () => new Response(JSON.stringify({
      error: { status: "RESOURCE_EXHAUSTED", message: `secret ${testApiKey}` }
    }), { status: 429 })
  }));
  const payload = await quotaResult.json();

  assert.equal(quotaResult.status, 429);
  assert.equal(payload.error, "quota_exceeded");
  assert.equal(JSON.stringify(payload).includes(testApiKey), false);
});

test("times out stalled Gemini requests", async () => {
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    timeoutMs: 5,
    fetcher: (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    })
  }));

  assert.equal(result.status, 504);
  assert.equal((await result.json()).error, "request_timeout");
});

test("reports supported alternatives when the configured model times out and is unavailable", async () => {
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    timeoutMs: 5,
    fetcher: (url, init) => {
      if (url.includes(":generateContent")) {
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      }
      return Promise.resolve(new Response(JSON.stringify({
        models: [{
          name: "models/gemini-compatible",
          supportedGenerationMethods: ["generateContent"]
        }]
      }), { status: 200 }));
    }
  }));
  const payload = await result.json();

  assert.equal(result.status, 503);
  assert.equal(payload.error, "model_unavailable");
  assert.deepEqual(payload.models, ["gemini-compatible"]);
});

test("times out while reading a stalled Gemini response body", async () => {
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

test("enforces per-client rate limits without persisting client addresses", async () => {
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

test("reports missing configuration without calling Gemini", async () => {
  let called = false;
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    env: {},
    fetcher: async () => {
      called = true;
      return new Response();
    }
  }));

  assert.equal(result.status, 503);
  assert.equal((await result.json()).error, "service_not_configured");
  assert.equal(called, false);
});

test("does not turn unexpected exceptions into a successful response", async () => {
  const result = await handleAssistantRequest(request(userMessage()), dependencies({
    getClientIdentifier: async () => {
      throw new AssistantRequestError(503, "rate_limit_unavailable");
    }
  }));

  assert.equal(result.status, 503);
  assert.equal((await result.json()).error, "rate_limit_unavailable");
});
