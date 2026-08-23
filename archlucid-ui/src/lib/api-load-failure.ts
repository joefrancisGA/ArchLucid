import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";
import { maybeReportApiServerErrorFromUnknown } from "@/lib/error-telemetry";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";

/** Serializable load failure for server and client components (Problem Details + correlation id). */
export type ApiLoadFailureState = {
  message: string;
  problem: ApiProblemDetails | null;
  correlationId: string | null;
  /** Set when the source was {@link ApiRequestError}; used for stale-resource → branded Not Found. */
  httpStatus: number | null;
  /** Seconds suggested by `Retry-After` when the source was {@link ApiRequestError}. */
  retryAfterSeconds: number | null;
};

/** True when `value` is already a normalized proxy/API load failure payload. */
export function isApiLoadFailureState(value: unknown): value is ApiLoadFailureState {
  if (value === null || typeof value !== "object") {
    return false;
  }

  // ApiRequestError carries the same fields but must be mapped via toApiLoadFailure.
  if (value instanceof Error) {
    return false;
  }

  const candidate = value as ApiLoadFailureState;

  return (
    typeof candidate.message === "string"
    && "problem" in candidate
    && "correlationId" in candidate
    && "httpStatus" in candidate
    && "retryAfterSeconds" in candidate
  );
}

const NOT_FOUND_ERROR_CODES = new Set([
  "RESOURCE_NOT_FOUND",
  "RUN_NOT_FOUND",
  "MANIFEST_NOT_FOUND",
]);

/** True when the API reported the target resource is missing (404 or not-found error codes). */
export function isApiNotFoundFailure(f: ApiLoadFailureState | null | undefined): boolean {
  if (f === null || f === undefined) {
    return false;
  }

  if (f.httpStatus === 404) {
    return true;
  }

  const ps = f.problem?.status;

  if (ps === 404) {
    return true;
  }

  const errorCode = f.problem?.errorCode?.trim();

  return errorCode !== undefined && NOT_FOUND_ERROR_CODES.has(errorCode);
}

const TRANSIENT_HTTP_STATUSES = new Set([408, 502, 503, 504]);

const TRANSIENT_ERROR_CODES = new Set([
  "DATABASE_TIMEOUT",
  "DATABASE_UNAVAILABLE",
  "CIRCUIT_BREAKER_OPEN",
]);

export type ApiLoadFailurePresentation = "not-found" | "transient" | "error";

function messageLooksTransient(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("aborterror") ||
    lower.includes("aborted") ||
    lower.includes("upstream api unreachable") ||
    lower.includes("econnreset") ||
    lower.includes("fetch failed") ||
    lower.includes("network")
  );
}

/** True when the failure is likely temporary (timeout, upstream unavailable, overload). */
export function isApiTransientLoadFailure(f: ApiLoadFailureState | null | undefined): boolean {
  if (f === null || f === undefined) {
    return false;
  }

  if (f.httpStatus !== null && TRANSIENT_HTTP_STATUSES.has(f.httpStatus)) {
    return true;
  }

  if (f.httpStatus !== null && f.httpStatus >= 500) {
    return true;
  }

  const errorCode = f.problem?.errorCode?.trim();

  if (errorCode !== undefined && TRANSIENT_ERROR_CODES.has(errorCode)) {
    return true;
  }

  if (f.httpStatus === null && messageLooksTransient(f.message)) {
    return true;
  }

  return false;
}

/** True when the failure looks like a timeout rather than a hard outage. */
export function isApiTimeoutLoadFailure(f: ApiLoadFailureState | null | undefined): boolean {
  if (f === null || f === undefined) {
    return false;
  }

  if (f.httpStatus === 408 || f.httpStatus === 504) {
    return true;
  }

  if (f.problem?.errorCode?.trim() === "DATABASE_TIMEOUT") {
    return true;
  }

  const lower = f.message.toLowerCase();

  return lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborterror");
}

/** Branded recovery UI: missing resource vs retryable outage vs generic error. */
export function resolveApiLoadFailurePresentation(
  failure: ApiLoadFailureState | null | undefined,
): ApiLoadFailurePresentation {
  if (failure === null || failure === undefined) {
    return "error";
  }

  if (isApiTransientLoadFailure(failure)) {
    return "transient";
  }

  if (isApiNotFoundFailure(failure)) {
    return "not-found";
  }

  return "error";
}

export function toApiLoadFailure(error: unknown): ApiLoadFailureState {
  if (isApiLoadFailureState(error)) {
    return error;
  }

  if (isApiRequestError(error)) {
    maybeReportApiServerErrorFromUnknown(error);

    return {
      message: error.message,
      problem: error.problem,
      correlationId: ensureCorrelationId(error.correlationId ?? error.problem?.correlationId),
      httpStatus: error.httpStatus,
      retryAfterSeconds: error.retryAfterSeconds,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      problem: null,
      correlationId: ensureCorrelationId(null),
      httpStatus: null,
      retryAfterSeconds: null,
    };
  }

  return {
    message: "An unexpected error occurred.",
    problem: null,
    correlationId: ensureCorrelationId(null),
    httpStatus: null,
    retryAfterSeconds: null,
  };
}

/** Validation or UI messages that are not API Problem Details. */
export function uiFailureFromMessage(message: string): ApiLoadFailureState {
  const trimmed = message.trim();

  return {
    message: trimmed.length > 0 ? trimmed : "Something went wrong.",
    problem: null,
    correlationId: ensureCorrelationId(null),
    httpStatus: null,
    retryAfterSeconds: null,
  };
}
