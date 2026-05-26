import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { notifyTrialLimitFromApiError } from "@/lib/trial-limit-modal-bridge";
import { shouldShowJwtBearerMissingRoleBanner } from "@/lib/operator-shell-principal-snapshot";
import { parseTrialLimitProblemDetails } from "@/lib/trial-limit-problem";
import { CORRELATION_ID_HEADER, generateCorrelationId } from "@/lib/correlation";
import { getServerApiBaseUrl } from "@/lib/config";
import { getServerUpstreamAuthHeaders } from "@/lib/legacy-arch-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { ensureAccessTokenFresh, getAccessTokenForApi } from "@/lib/oidc/session";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { getScopeHeaders } from "@/lib/scope";
import { trySandboxMockJsonForApiGet } from "@/lib/sandbox-api-mocks";

/** Shared HTTP helpers (JSON + proxy routing). */

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

/**
 * Same routing as JSON calls, but Accept allows binary artifact bodies (UTF-8 text from synthesis).
 */
export function resolveBinaryGetRequest(path: string): { url: string; headers: HeadersInit } {
  if (isBrowser()) {
    const url = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: "*/*",
      ...getEffectiveBrowserProxyScopeHeaders(),
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
    ...getScopeHeaders(),
    ...getServerUpstreamAuthHeaders(),
  };

  return { url, headers };
}

/**
 * Builds URL + headers for a JSON GET/POST.
 * Server (RSC): direct to backend with API key + scope headers.
 * Browser: same-origin `/api/proxy` so secrets stay server-side.
 */
export function resolveRequest(path: string): { url: string; headers: HeadersInit } {
  if (isBrowser()) {
    const url = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...getEffectiveBrowserProxyScopeHeaders(),
    };
    const bearer = getBearerToken();
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    return { url, headers };
  }

  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getScopeHeaders(),
    ...getServerUpstreamAuthHeaders(),
  };

  return { url, headers };
}

export function withCorrelationHeaders(headers: HeadersInit): Headers {
  const h = new Headers(headers);
  h.set(CORRELATION_ID_HEADER, generateCorrelationId());

  return h;
}

export function throwApiRequestError(response: Response, bodyText: string): never {
  const err = buildApiRequestErrorFromParts(response, bodyText);

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
          "Your token is authenticated but lacks ArchLucidRoles (Admin, Operator, Reader, or Auditor). Map IdP claims via ArchLucidAuth:RoleClaimSources — see CONFIGURATION_REFERENCE.md.",
        correlationId: err.correlationId,
      });
    });
  }

  if (isBrowser() && err.httpStatus >= 500) {
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

export async function apiGetJsonWithTrace<T>(path: string): Promise<ApiResponseWithTrace<T>> {
  const sandboxPayload = trySandboxMockJsonForApiGet(path);

  if (sandboxPayload !== undefined) {
    return { data: sandboxPayload as T, traceId: null };
  }

  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(path);
  const h = withCorrelationHeaders(headers);
  const response = await fetch(url, {
    cache: "no-store",
    headers: h,
  });
  const text = await response.text();
  const traceId = extractTraceId(response);

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  return { data: JSON.parse(text) as T, traceId };
}

/** GETs JSON from the ArchLucid API. Throws {@link ApiRequestError} on HTTP errors. */
export async function apiGet<T>(path: string): Promise<T> {
  const { data } = await apiGetJsonWithTrace<T>(path);

  return data;
}

/** POSTs a JSON body to the ArchLucid API and returns the parsed response. Throws on HTTP errors. */
export async function apiPostJson<T>(
  path: string,
  body: unknown,
  options?: { readonly extraHeaders?: Record<string, string> },
): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(path);
  const h = withCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");

  if (options?.extraHeaders) {
    for (const [key, value] of Object.entries(options.extraHeaders)) {
      h.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: h,
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  notifyIfIdempotencyReplayed(response);

  return JSON.parse(text) as T;
}

/** PATCHes a JSON body to the ArchLucid API and returns the parsed response. Throws on HTTP errors. */
export async function apiPatchJson<T>(path: string, body: unknown): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(path);
  const h = withCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, {
    method: "PATCH",
    headers: h,
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  notifyIfIdempotencyReplayed(response);

  return JSON.parse(text) as T;
}

/** POSTs a JSON body to the ArchLucid API and expects no response body. Throws on HTTP errors. */
export async function apiPostNoContent(path: string, body: unknown): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(path);
  const h = withCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, {
    method: "POST",
    headers: h,
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  notifyIfIdempotencyReplayed(response);
}

/** PUTs a JSON body to the ArchLucid API and expects no response body. Throws on HTTP errors. */
export async function apiPutNoContent(path: string, body: unknown): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(path);
  const h = withCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, {
    method: "PUT",
    headers: h,
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  notifyIfIdempotencyReplayed(response);
}

/** DELETEs a path; returns void on 2xx. Throws on HTTP errors. */
export async function apiDelete(path: string): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(path);
  const h = withCorrelationHeaders(headers);
  const response = await fetch(url, {
    method: "DELETE",
    headers: h,
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  notifyIfIdempotencyReplayed(response);
}

/** Same proxy/scope/API-key behavior as other UI API calls; for graph modules, etc. */
export async function fetchArchLucidJson<T>(path: string): Promise<T> {
  return apiGet<T>(path);
}
