export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_BODY_BYTES = 40_000;
const MAX_MESSAGES = 11;
const MAX_USER_MESSAGE_LENGTH = 2_000;
const MAX_MODEL_MESSAGE_LENGTH = 4_000;
const MAX_TOTAL_LENGTH = 8_000;
const MAX_OUTPUT_TOKENS = 700;
const SYSTEM_INSTRUCTION = [
  "You are Growise AI Assistant, a practical marketing guide for HUFLIT student founders and early-stage startups.",
  "Help with marketing strategy, target-customer research, channel selection, budget optimization, marketing-plan development, campaign-performance review, and startup growth.",
  "Make advice realistic for student teams with limited budgets. Ask concise follow-up questions when important context is missing.",
  "Do not invent market facts, statistics, prices, or campaign results. Clearly label assumptions and suggest how to validate them.",
  "Never promise revenue, business success, or campaign effectiveness. Do not present illustrative budgets as financial advice.",
  "Do not request passwords, authentication codes, student records, consultation form details, or feedback form content.",
  "Use the language of the user's latest message. Be concise, supportive, and actionable."
].join(" ");

export class AssistantRequestError extends Error {
  constructor(status, code, details = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createRateLimiter({
  limit = 5,
  windowMs = 60_000,
  maxEntries = 2_000,
  now = Date.now
} = {}) {
  const entries = new Map();

  return {
    consume(identity) {
      const currentTime = now();
      let entry = entries.get(identity);

      if (!entry || currentTime - entry.windowStartedAt >= windowMs) {
        if (!entry && entries.size >= maxEntries) {
          for (const [key, value] of entries) {
            if (currentTime - value.windowStartedAt >= windowMs) entries.delete(key);
          }
        }
        if (!entry && entries.size >= maxEntries) {
          return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
        }
        entry = { windowStartedAt: currentTime, count: 0 };
        entries.set(identity, entry);
      }

      if (entry.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((windowMs - (currentTime - entry.windowStartedAt)) / 1000)
          )
        };
      }

      entry.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    }
  };
}

export function getClientAddress(request) {
  const address = request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return address && address.length <= 128 ? address : null;
}

export async function hashClientAddress(address) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(address)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function response(request, jsonResponse, body, status) {
  return jsonResponse(request, body, status);
}

async function readRequestBody(request) {
  const contentType = request.headers.get("Content-Type") || "";
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (
    !contentType.toLowerCase().includes("application/json")
    || (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES)
  ) {
    throw new AssistantRequestError(400, "invalid_request");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new AssistantRequestError(400, "invalid_request");

  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new AssistantRequestError(413, "request_too_large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error("invalid object");
    }
    return value;
  } catch {
    throw new AssistantRequestError(400, "invalid_request");
  }
}

function validateMessages(body) {
  if (
    Object.keys(body).length !== 1
    || !Array.isArray(body.messages)
    || body.messages.length === 0
    || body.messages.length > MAX_MESSAGES
  ) {
    throw new AssistantRequestError(400, "invalid_request");
  }

  let totalLength = 0;
  const messages = body.messages.map((message, index) => {
    const expectedRole = index % 2 === 0 ? "user" : "model";
    if (
      typeof message !== "object"
      || message === null
      || Array.isArray(message)
      || Object.keys(message).length !== 2
      || message.role !== expectedRole
      || typeof message.text !== "string"
    ) {
      throw new AssistantRequestError(400, "invalid_request");
    }

    const text = message.text.trim();
    const maximumLength = expectedRole === "user"
      ? MAX_USER_MESSAGE_LENGTH
      : MAX_MODEL_MESSAGE_LENGTH;
    if (!text || text.length > maximumLength) {
      throw new AssistantRequestError(
        400,
        expectedRole === "user" ? "message_too_long" : "invalid_request"
      );
    }
    totalLength += text.length;
    if (totalLength > MAX_TOTAL_LENGTH) {
      throw new AssistantRequestError(400, "history_too_long");
    }
    return { role: expectedRole, text };
  });

  if (messages.at(-1)?.role !== "user") {
    throw new AssistantRequestError(400, "invalid_request");
  }
  return messages;
}

async function fetchJsonWithTimeout(fetcher, url, init, timeoutMs) {
  const controller = new AbortController();
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      const error = new Error("request_timeout");
      error.name = "TimeoutError";
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      (async () => {
        const result = await fetcher(url, { ...init, signal: controller.signal });
        return { result, payload: await readProviderJson(result) };
      })(),
      timeout
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readProviderJson(result) {
  try {
    return await result.json();
  } catch {
    return null;
  }
}

function providerErrorStatus(payload) {
  return typeof payload?.error?.status === "string"
    ? payload.error.status.toUpperCase()
    : "";
}

function isUnavailableModel(result, payload) {
  const status = providerErrorStatus(payload);
  const message = typeof payload?.error?.message === "string"
    ? payload.error.message.toLowerCase()
    : "";
  return result.status === 404
    || status === "NOT_FOUND"
    || (result.status === 400 && /model.+(not found|not supported|does not exist)/.test(message));
}

function suggestedModels(models, currentModel) {
  return models.filter((model) => model !== currentModel).slice(0, 10);
}

async function getSupportedModels(fetcher, apiKey, timeoutMs) {
  const models = [];
  let pageToken = "";

  for (let page = 0; page < 5; page += 1) {
    const params = new URLSearchParams({ pageSize: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    let response;
    let payload;
    try {
      ({ result: response, payload } = await fetchJsonWithTimeout(
        fetcher,
        `${GEMINI_API_BASE}/models?${params}`,
        { method: "GET", headers: { "x-goog-api-key": apiKey } },
        timeoutMs
      ));
    } catch {
      return [];
    }
    if (!response.ok) return [];
    if (!Array.isArray(payload?.models)) return [];
    for (const model of payload.models) {
      if (
        typeof model?.name === "string"
        && Array.isArray(model.supportedGenerationMethods)
        && model.supportedGenerationMethods.includes("generateContent")
      ) {
        models.push(model.name.replace(/^models\//, ""));
      }
    }
    if (typeof payload.nextPageToken !== "string" || !payload.nextPageToken) break;
    pageToken = payload.nextPageToken;
  }

  return [...new Set(models)].slice(0, 100);
}

export async function handleAssistantRequest(request, dependencies) {
  const {
    env,
    fetcher = fetch,
    isAllowedOrigin,
    jsonResponse,
    consumeRateLimit,
    getClientIdentifier,
    timeoutMs = 25_000
  } = dependencies;

  if (!isAllowedOrigin(request.headers.get("Origin"))) {
    return response(request, jsonResponse, { error: "origin_not_allowed" }, 403);
  }
  if (request.method !== "POST") {
    return response(request, jsonResponse, { error: "method_not_allowed" }, 405);
  }

  try {
    const body = await readRequestBody(request);
    const messages = validateMessages(body);
    const identifier = await getClientIdentifier(request);
    if (!identifier) throw new AssistantRequestError(503, "rate_limit_unavailable");

    const rateLimit = consumeRateLimit(identifier);
    if (!rateLimit.allowed) {
      throw new AssistantRequestError(429, "rate_limited", {
        retryAfterSeconds: rateLimit.retryAfterSeconds
      });
    }

    const apiKey = env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new AssistantRequestError(503, "service_not_configured");
    const model = (env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
    if (!/^(?:models\/)?[A-Za-z0-9._-]{1,128}$/.test(model)) {
      throw new AssistantRequestError(503, "model_not_configured");
    }
    const modelName = model.replace(/^models\//, "");
    const endpoint = `${GEMINI_API_BASE}/models/${encodeURIComponent(modelName)}:generateContent`;
    let payload;
    let result;
    try {
      ({ result, payload } = await fetchJsonWithTimeout(
        fetcher,
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: messages.map(({ role, text }) => ({
              role,
              parts: [{ text }]
            })),
            generationConfig: {
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              thinkingConfig: { thinkingLevel: "MINIMAL" }
            }
          })
        },
        timeoutMs
      ));
    } catch (error) {
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        const supportedModels = await getSupportedModels(
          fetcher,
          apiKey,
          Math.min(timeoutMs, 10_000)
        );
        if (supportedModels.length && !supportedModels.includes(modelName)) {
          throw new AssistantRequestError(503, "model_unavailable", {
            models: supportedModels
          });
        }
        throw new AssistantRequestError(504, "request_timeout");
      }
      throw new AssistantRequestError(502, "provider_unavailable");
    }

    if (!result.ok) {
      if (isUnavailableModel(result, payload)) {
        const supportedModels = await getSupportedModels(fetcher, apiKey, timeoutMs);
        throw new AssistantRequestError(503, "model_unavailable", {
          models: suggestedModels(supportedModels, modelName)
        });
      }
      const providerStatus = providerErrorStatus(payload);
      if (result.status === 503 && providerStatus === "UNAVAILABLE") {
        const supportedModels = await getSupportedModels(
          fetcher,
          apiKey,
          Math.min(timeoutMs, 10_000)
        );
        throw new AssistantRequestError(503, "model_temporarily_unavailable", {
          models: suggestedModels(supportedModels, modelName)
        });
      }
      if (
        result.status === 429
        || providerStatus === "RESOURCE_EXHAUSTED"
        || providerStatus === "QUOTA_EXCEEDED"
      ) {
        throw new AssistantRequestError(429, "quota_exceeded");
      }
      if (result.status === 401 || result.status === 403) {
        throw new AssistantRequestError(503, "gemini_credentials_invalid");
      }
      throw new AssistantRequestError(502, "provider_unavailable");
    }

    const parts = payload?.candidates?.[0]?.content?.parts;
    const answer = Array.isArray(parts)
      ? parts.map((part) => typeof part?.text === "string" ? part.text : "").join("").trim()
      : "";
    if (!answer) throw new AssistantRequestError(502, "empty_response");
    if (answer.length > MAX_MODEL_MESSAGE_LENGTH) {
      throw new AssistantRequestError(502, "invalid_response");
    }

    return response(request, jsonResponse, { reply: answer }, 200);
  } catch (error) {
    if (error instanceof AssistantRequestError) {
      return response(
        request,
        jsonResponse,
        { error: error.code, ...error.details },
        error.status
      );
    }
    return response(request, jsonResponse, { error: "request_failed" }, 500);
  }
}
