/** Shared HTTP helpers (JSON + proxy routing). */

import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { notifyTrialLimitFromApiError } from "@/lib/trial-limit-modal-bridge";
import { shouldShowJwtBearerMissingRoleBanner } from "@/lib/operator/operator-shell-principal-snapshot";
import { parseTrialLimitProblemDetails } from "@/lib/trial-limit-problem";
import { captureTraceContextFromResponse } from "@/lib/correlation";
import { tryParseJsonResponseText } from "@/lib/parse-json-response-text";
import { trySandboxMockJsonForApiGet } from "@/lib/sandbox-api-mocks";
import { fetchWithWarmupRetry } from "@/lib/warmup-retry";

import { ensureOidcBearerReady, isBrowser, PROBLEM_DETAILS_AUDIENCE_HEADER } from "./http-auth";
import {
  applyCorrelationHeaders,
  extractTraceId,
  resolveRequest,
  serverFetchInit,
  withCorrelationHeaders,
} from "./http-proxy";

export { ensureOidcBearerReady, getBearerToken, isBrowser, PROBLEM_DETAILS_AUDIENCE_HEADER } from "./http-auth";
export {
  applyCorrelationHeaders,
  browserProxyUrl,
  extractTraceId,
  resolveBinaryGetRequest,
  resolveRequest,
  withCorrelationHeaders,
} from "./http-proxy";

export interface ApiResponseWithTrace<T> {
  data: T;
  traceId: string | null;
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
