import {
  handleOptions,
  isAllowedOrigin,
  jsonResponse
} from "../_shared/auth.ts";
import {
  createRateLimiter,
  getClientAddress,
  handleAssistantRequest,
  hashClientAddress
} from "./core.mjs";

const rateLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;

  return handleAssistantRequest(request, {
    env: {
      GEMINI_API_KEY: Deno.env.get("GEMINI_API_KEY"),
      GEMINI_MODEL: Deno.env.get("GEMINI_MODEL")
    },
    isAllowedOrigin,
    jsonResponse,
    consumeRateLimit: (identifier: string) => rateLimiter.consume(identifier),
    getClientIdentifier: async (incomingRequest: Request) => {
      const address = getClientAddress(incomingRequest);
      return address ? hashClientAddress(address) : null;
    },
    timeoutMs: 20_000
  });
});
