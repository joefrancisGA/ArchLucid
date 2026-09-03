/** HTTP GET helpers and shared error handling. */

import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { notifyTrialLimitFromApiError } from "@/lib/trial-limit-modal-bridge";
import { shouldShowJwtBearerMissingRoleBanner } from "@/lib/operator/operator-shell-principal-snapshot";
import { parseTrialLimitProblemDetails } from "@/lib/trial-limit-problem";
import { captureTraceContextFromResponse } from "@/lib/correlation";
import { tryParseJsonResponseText } from "@/lib/parse-json-response-text";
import { trySandboxMockJsonForApiGet } from "@/lib/sandbox-api-mocks";
import { fetchWithWarmupRetry } from "@/lib/warmup-retry";

import { ensureOidcBearerReady, isBrowser } from "./http-auth";
import {
  applyCorrelationHeaders,
  extractTraceId,
  resolveRequest,
  serverFetchInit,
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

/** Same proxy/scope/API-key behavior as other UI API calls; for graph modules, etc. */
export async function fetchArchLucidJson<T>(path: string): Promise<T> {
  return apiGet<T>(path);
}
