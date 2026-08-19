import type { ApiProblemDetails } from "@/lib/api-problem";
import { isProxyUpstreamTimeoutFailure } from "@/lib/proxy-upstream-unreachable-detail";

/** Non-idempotent create path — callers must not auto-retry without an Idempotency-Key. */
export const ARCHITECTURE_REQUEST_CREATE_PATH = "/v1/architecture/request";

/** Operator-facing copy when create-run POST times out at the gateway. */
export const ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE =
  "Request timed out creating the architecture review (POST /v1/architecture/request). Please check the Reviews list before resubmitting to avoid duplicates.";

/**
 * True when create-run failed because a gateway / UI BFF aborted waiting on ArchLucid.Api.
 * Proxy AbortSignal.timeout surfaces as HTTP 502 with timeout wording (not always 504).
 */
export function isArchitectureRequestCreateGatewayTimeout(
  httpStatus: number,
  problem?: ApiProblemDetails | null,
): boolean {
  if (httpStatus === 504 || httpStatus === 408) {
    return true;
  }

  if (httpStatus !== 502) {
    return false;
  }

  const detail = problem?.detail?.trim() ?? "";

  return detail.length > 0 && isProxyUpstreamTimeoutFailure(detail);
}
