import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { notifyTrialLimitFromApiError } from "@/lib/trial-limit-modal-bridge";
import { shouldShowJwtBearerMissingRoleBanner } from "@/lib/operator/operator-shell-principal-snapshot";
import { parseTrialLimitProblemDetails } from "@/lib/trial-limit-problem";
import { CORRELATION_ID_HEADER, applyTraceParentHeader, captureTraceContextFromResponse, generateCorrelationId } from "@/lib/correlation";
import { getServerApiBaseUrl } from "@/lib/config";
import { getServerUpstreamAuthHeaders } from "@/lib/legacy-arch-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { ensureAccessTokenFresh, getAccessTokenForApi } from "@/lib/oidc/session";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { getScopeHeaders } from "@/lib/scope";
import { SERVER_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { tryParseJsonResponseText } from "@/lib/parse-json-response-text";
import { trySandboxMockJsonForApiGet } from "@/lib/sandbox-api-mocks";
import { fetchWithWarmupRetry } from "@/lib/warmup-retry";

/** Shared HTTP helpers (JSON + proxy routing). */

/** TB-284: buyer-polished shell requests audience-tier problem details (no internal route hints). */
export const PROBLEM_DETAILS_AUDIENCE_HEADER = "x-archlucid-audience";

function audienceHeadersForCurrentShell(): Record<string, string> {
  return { [PROBLEM_DETAILS_AUDIENCE_HEADER]: "buyer" };
}

export interface ApiResponseWithTrace<T> {
  data: T;
  traceId: string | null;
}

/** Returns the trace id from the `X-Trace-Id` response header, or null if absent. */
export function extractTraceId(response: Response): string | null {
  return response.headers.get("X-Trace-Id") ?? null;
}

/** Returns true when executing in the browser (client component), false on the Node.js server (RSC). */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Same-origin proxy path for browser JSON/binary calls. Vitest/jsdom exposes `window` but Node `fetch`
 * requires an absolute URL — use a stable localhost base only under Vitest.
 */
function browserProxyUrl(path: string): string {
  const relative = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;

  if (typeof process !== "undefined" && process.env.VITEST !== undefined) {
    return new URL(relative, "http://localhost").href;
  }

  return relative;
}

export async function ensureOidcBearerReady(): Promise<void> {
  if (isBrowser() && isJwtAuthMode()) {
    await ensureAccessTokenFresh();
  }
}

/**
 * Returns a bearer token for JWT-based API auth when running in the browser (OIDC session).
 */
export function getBearerToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  if (!isJwtAuthMode()) {
    return undefined;
  }

  return getAccessTokenForApi();
}

async function resolveScopeHeadersForRequest(): Promise<Record<string, string>> {
  if (isBrowser()) {
    return getEffectiveBrowserProxyScopeHeaders();
  }

  // Server RSC loaders that need cookie scope must pass `scopeHeaders` explicitly
  // (see load-run-detail-page-model.ts). Shared http helpers stay client-importable.
  return getScopeHeaders();
}

/**
 * Same routing as JSON calls, but Accept allows binary artifact bodies (UTF-8 text from synthesis).
 */
export async function resolveBinaryGetRequest(path: string): Promise<{ url: string; headers: HeadersInit }> {
  if (isBrowser()) {
    const url = browserProxyUrl(path);
    const headers: Record<string, string> = {
      Accept: "*/*",
      ...(await resolveScopeHeadersForRequest()),
    };
    const bearer = getBearerToken();

    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }

    return { url, headers };
  }

  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "*/*",
    ...(await resolveScopeHeadersForRequest()),
    ...getServerUpstreamAuthHeaders(),
  };

  return { url, headers };
}

/**
 * Builds URL + headers for a JSON GET/POST.
 * Server (RSC): direct to backend with API key + scope headers.
 * Browser: same-origin `/api/proxy` so secrets stay server-side.
 */
export async function resolveRequest(
  path: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<{ url: string; headers: HeadersInit }> {
  if (isBrowser()) {
    const url = browserProxyUrl(path);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(await resolveScopeHeadersForRequest()),
      ...audienceHeadersForCurrentShell(),
    };
    const bearer = getBearerToken();

    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }

    return { url, headers };
  }

  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options?.scopeHeaders ?? (await resolveScopeHeadersForRequest())),
    ...getServerUpstreamAuthHeaders(),
    ...audienceHeadersForCurrentShell(),
  };

  return { url, headers };
}

/** Applies a fresh correlation id header; returns headers and id for error fallback (TB-271). */
export function applyCorrelationHeaders(headers: HeadersInit): { headers: Headers; correlationId: string } {
  const correlationId = generateCorrelationId();
  const h = new Headers(headers);
  h.set(CORRELATION_ID_HEADER, correlationId);
  applyTraceParentHeader(h);

  return { headers: h, correlationId };
}

export function withCorrelationHeaders(headers: HeadersInit): Headers {
  return applyCorrelationHeaders(headers).headers;
}

function serverFetchInit(
  headers: Headers,
  init?: { readonly method?: string; readonly body?: string; readonly signal?: AbortSignal },
): RequestInit {
  const requestInit: RequestInit = {
    cache: "no-store",
    headers,
    ...init,
  };

  if (init?.signal !== undefined) {
    requestInit.signal = init.signal;
  } else if (!isBrowser()) {
    requestInit.signal = AbortSignal.timeout(SERVER_UPSTREAM_FETCH_TIMEOUT_MS);
  }

  return requestInit;
}

export type ApiGetOptions = {
  readonly scopeHeaders?: Record<string, string>;
  readonly signal?: AbortSignal;
  /** When true, do not surface automatic 5xx Sonner toasts (optional background probes). */
  readonly suppressErrorToast?: boolean;
};

export function throwApiRequestError(
  response: Response,
  bodyText: string,
  requestCorrelationId?: string | null,
  options?: Pick<ApiGetOptions, "suppressErrorToast">,
): never {
  const err = buildApiRequestErrorFromParts(response, bodyText, requestCorrelationId);

  if (isBrowser() && err.httpStatus === 402) {
    const trial = parseTrialLimitProblemDetails(bodyText);

    if (trial !== null) {
      notifyTrialLimitFromApiError(err.problem?.title, err.problem?.detail, trial);
    }
  }

  if (isBrowser() && err.httpStatus === 403 && shouldShowJwtBearerMissingRoleBanner()) {
    void import("@/lib/api-error-toast").then(({ showApiError }) => {
      showApiError("Not permitted — missing ArchLucid role", {
        type: "warning",
        detail:
          "Your token is authenticated but does not map to an ArchLucid workspace role (Admin, Operator, Reader, or Auditor). Ask a workspace administrator to map your identity-provider groups, then sign in again.",
        correlationId: err.correlationId,
      });
    });
  }

  if (isBrowser() && err.httpStatus >= 500 && options?.suppressErrorToast !== true) {
    void import("@/lib/api-error-toast").then(({ showApiRequestErrorToast }) => {
      showApiRequestErrorToast(err);
    });
  }

  throw err;
}

function notifyIfIdempotencyReplayed(response: Response): void {
  if (isBrowser() && response.headers.get("X-Idempotency-Replayed") === "true") {
    void import("@/lib/toast").then(({ showInfo }) => {
      showInfo("Resumed previous request — no duplicate review created.");
    });
  }
}

export async function apiGetJsonWithTrace<T>(
  path: string,
  options?: ApiGetOptions,
): Promise<ApiResponseWithTrace<T>> {
  const sandboxPayload = trySandboxMockJsonForApiGet(path);

  if (sandboxPayload !== undefined) {
    return { data: sandboxPayload as T, traceId: null };
  }

  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path, options);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  const fetchOnce = () => fetch(url, serverFetchInit(h, { signal: options?.signal }));
  const response = isBrowser()
    ? await fetchOnce()
    : await fetchWithWarmupRetry(fetchOnce);
  captureTraceContextFromResponse(response);
  const text = await response.text();
  const traceId = extractTraceId(response);

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId, options);
  }

  const parsed = tryParseJsonResponseText<T>(text);

  if (parsed === null) {
    throwApiRequestError(response, text, correlationId, options);
  }

  return { data: parsed, traceId };
}

/** GETs JSON from the ArchLucid API. Throws {@link ApiRequestError} on HTTP errors. */
export async function apiGet<T>(path: string, options?: ApiGetOptions): Promise<T> {
  const { data } = await apiGetJsonWithTrace<T>(path, options);

  return data;
}

/** POSTs a JSON body to the ArchLucid API and returns the parsed response. Throws on HTTP errors. */
export async function apiPostJson<T>(
  path: string,
  body: unknown,
  options?: { readonly extraHeaders?: Record<string, string> },
): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");

  if (options?.extraHeaders) {
    for (const [key, value] of Object.entries(options.extraHeaders)) {
      h.set(key, value);
    }
  }

  const response = await fetch(
    url,
    serverFetchInit(h, { method: "POST", body: JSON.stringify(body) }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);

  return JSON.parse(text) as T;
}

/**
 * POSTs JSON and accepts Tier C async semantics: HTTP 202 + Location (TB-2075 / TB-2077).
 * Empty bodies are allowed; callers parse the Location header for the operation handle.
 */
export async function apiPostAcceptedWithLocation(
  path: string,
  body: unknown,
  options?: { readonly extraHeaders?: Record<string, string> },
): Promise<{ readonly location: string | null; readonly status: number }> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");

  if (options?.extraHeaders) {
    for (const [key, value] of Object.entries(options.extraHeaders)) {
      h.set(key, value);
    }
  }

  const response = await fetch(
    url,
    serverFetchInit(h, { method: "POST", body: JSON.stringify(body) }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (response.status !== 202) {
    if (!response.ok) {
      throwApiRequestError(response, text, correlationId);
    }

    throwApiRequestError(
      response,
      text.length > 0 ? text : "Expected 202 Accepted with a Location header.",
      correlationId,
    );
  }

  notifyIfIdempotencyReplayed(response);

  return {
    location: response.headers.get("Location"),
    status: response.status,
  };
}

/** PATCHes a JSON body to the ArchLucid API and returns the parsed response. Throws on HTTP errors. */
export async function apiPatchJson<T>(path: string, body: unknown): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(
    url,
    serverFetchInit(h, { method: "PATCH", body: JSON.stringify(body) }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);

  return JSON.parse(text) as T;
}

/** POSTs a JSON body to the ArchLucid API and expects no response body. Throws on HTTP errors. */
export async function apiPostNoContent(path: string, body: unknown): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(
    url,
    serverFetchInit(h, { method: "POST", body: JSON.stringify(body) }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);
}

/** PUTs a JSON body to the ArchLucid API and returns the parsed response. Throws on HTTP errors. */
export async function apiPutJson<T>(path: string, body: unknown): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, serverFetchInit(h, { method: "PUT", body: JSON.stringify(body) }));
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);

  if (text.length === 0) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

/** PUTs a JSON body to the ArchLucid API and expects no response body. Throws on HTTP errors. */
export async function apiPutNoContent(path: string, body: unknown): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, serverFetchInit(h, { method: "PUT", body: JSON.stringify(body) }));
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);
}

/** DELETEs a path; returns void on 2xx. Throws on HTTP errors. */
export async function apiDelete(path: string): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  const response = await fetch(url, serverFetchInit(h, { method: "DELETE" }));
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);
}

/** Same proxy/scope/API-key behavior as other UI API calls; for graph modules, etc. */
export async function fetchArchLucidJson<T>(path: string): Promise<T> {
  return apiGet<T>(path);
}
