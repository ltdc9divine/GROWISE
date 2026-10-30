import { createClient } from "npm:@supabase/supabase-js@2";

const defaultOrigins = [
  "https://growise-five.vercel.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

export class RequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string
  ) {
    super(code);
  }
}

function getAllowedOrigins(): Set<string> {
  const configured = Deno.env.get("GROWISE_ALLOWED_ORIGINS");
  return new Set(
    (configured ? configured.split(",") : defaultOrigins)
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
  if (origin && getAllowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function handleOptions(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  const origin = request.headers.get("Origin");
  if (origin && !getAllowedOrigins().has(origin)) {
    return new Response(null, { status: 403, headers: corsHeaders(request) });
  }
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function jsonResponse(
  request: Request,
  payload: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("Content-Type") || "";
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (
    !contentType.toLowerCase().includes("application/json")
    || (Number.isFinite(contentLength) && contentLength > 8192)
  ) {
    throw new RequestError(400, "invalid_request");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "invalid_request");
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    if (totalBytes > 8192) throw new RequestError(400, "invalid_request");
    chunks.push(value);
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new RequestError(400, "invalid_request");
  }
  if (!isRecord(value)) {
    throw new RequestError(400, "invalid_request");
  }
  return value;
}

function environment(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new RequestError(503, "service_not_configured");
  return value;
}

export function createPublicClient(authorization?: string) {
  const headers = authorization ? { Authorization: authorization } : undefined;
  return createClient(
    environment("SUPABASE_URL"),
    environment("SUPABASE_ANON_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
      ...(headers ? { global: { headers } } : {})
    }
  );
}

export function createServiceClient() {
  return createClient(
    environment("SUPABASE_URL"),
    environment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function requireAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) throw new RequestError(401, "unauthorized");

  const client = createPublicClient(`Bearer ${match[1]}`);
  const { data: userData, error: userError } = await client.auth.getUser(match[1]);
  if (userError || !userData.user) throw new RequestError(401, "unauthorized");

  const { data: profile, error: profileError } = await client
    .from("growise_profiles")
    .select("username,must_change_password")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError || !profile) throw new RequestError(403, "account_not_ready");

  const { data: isAdmin, error: roleError } = await client.rpc(
    "growise_has_role",
    { requested_role: "admin" }
  );
  if (roleError) throw new RequestError(503, "role_check_unavailable");

  return {
    client,
    user: userData.user,
    profile,
    isAdmin: isAdmin === true,
    accessToken: match[1]
  };
}

export function errorResponse(request: Request, error: unknown): Response {
  if (error instanceof RequestError) {
    return jsonResponse(request, { error: error.code }, error.status);
  }
  return jsonResponse(request, { error: "request_failed" }, 500);
}
