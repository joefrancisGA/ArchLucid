/** Response handling shared by live-API helpers: assertion, rate-limit backoff, and buffered replay. */
import type { APIResponse } from "@playwright/test";

const RESPONSE_BODY_SNIPPET_LENGTH = 500;

const MAX_RETRY_AFTER_WAIT_MS = 60_000;

const DEFAULT_RATE_LIMIT_WAIT_MS = 2500;

/** Throws with status and a body snippet when the response is not 2xx. */
export async function throwIfNotOk(res: APIResponse, label: string): Promise<void> {

  if (res.ok()) {
    return;
  }

  const text = await res.text();
  const snippet = text.slice(0, RESPONSE_BODY_SNIPPET_LENGTH);

  let hint = "";

  if (res.status() === 401 && label.includes("/v1/")) {
    hint =
      " Hint: use auth lane matching the API — DevelopmentBypass expects no Bearer/X-Api-Key (omit LIVE_JWT_TOKEN and LIVE_API_KEY); JwtBearer CI needs LIVE_JWT_TOKEN; ApiKey needs LIVE_API_KEY. Confirm LIVE_API_URL points at ArchLucid.Api.";
  }

  throw new Error(`${label} failed ${res.status()}: ${snippet}${hint}`);
}

/** Waits after HTTP 429 using `Retry-After` when present (capped), else a short default. */
export async function delayAfterRateLimitedResponse(res: APIResponse): Promise<void> {
  const headers = res.headers();
  const retryAfterRaw = headers["retry-after"] ?? headers["Retry-After"];
  const seconds = retryAfterRaw ? Number.parseInt(String(retryAfterRaw).trim(), 10) : Number.NaN;
  const waitMs =
    Number.isFinite(seconds) && seconds > 0
      ? Math.min(seconds * 1000, MAX_RETRY_AFTER_WAIT_MS)
      : DEFAULT_RATE_LIMIT_WAIT_MS;

  await new Promise((resolve) => setTimeout(resolve, waitMs));
}

/** Replays a consumed Playwright response so negative-path callers can still read status/body. */
export function replayBufferedApiResponse(status: number, body: string, source: APIResponse): APIResponse {
  const headers = source.headers();

  return {
    ok: () => status >= 200 && status < 300,
    status: () => status,
    statusText: () => source.statusText(),
    headers: () => headers,
    headersArray: () =>
      Object.entries(headers).map(([name, value]) => ({
        name,
        value,
      })),
    text: async () => body,
    json: async () => JSON.parse(body) as unknown,
    body: async () => Buffer.from(body),
    url: () => source.url(),
    [Symbol.asyncDispose]: async () => {},
  };
}
