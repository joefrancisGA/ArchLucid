/** Header echoed by ArchLucid.Api `CorrelationIdMiddleware` (must match server). */
export const CORRELATION_ID_HEADER = "X-Correlation-ID";

/** W3C trace context header returned by `TraceResponseHeaderMiddleware`. */
export const TRACE_PARENT_HEADER = "traceparent";

/** Plain trace id header (32-char hex) returned alongside `traceparent`. */
export const TRACE_ID_HEADER = "X-Trace-Id";

const SAFE_CORRELATION_ID = /^[a-zA-Z0-9\-_.]+$/;

const TRACE_PARENT_PATTERN = /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i;

const SESSION_TRACE_PARENT_STORAGE_KEY = "archlucid.session.traceparent";

/**
 * Generates a new correlation id safe for the API middleware (alphanumeric, hyphen, underscore, dot; max 64).
 * UUID v4 fits the allowed charset and length.
 */
export function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** True if the value satisfies ArchLucid.Api correlation id validation (reuse inbound browser id when valid). */
export function isSafeCorrelationId(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 && trimmed.length <= 64 && SAFE_CORRELATION_ID.test(trimmed);
}

export function isValidTraceParent(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const trimmed = value.trim();

  return TRACE_PARENT_PATTERN.test(trimmed);
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/** Returns the last server `traceparent` captured for this browser tab session. */
export function readSessionTraceParent(): string | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_TRACE_PARENT_STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    return isValidTraceParent(raw) ? raw.trim() : null;
  } catch {
    return null;
  }
}

/** Persists a server `traceparent` for subsequent same-tab API calls. */
export function storeSessionTraceParent(value: string | null | undefined): void {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    if (value === null || value === undefined || !isValidTraceParent(value)) {
      window.sessionStorage.removeItem(SESSION_TRACE_PARENT_STORAGE_KEY);

      return;
    }

    window.sessionStorage.setItem(SESSION_TRACE_PARENT_STORAGE_KEY, value.trim());
  } catch {
    /* private mode / quota */
  }
}

/** Captures distributed-trace headers from an API response for follow-on browser requests. */
export function captureTraceContextFromResponse(response: Response): void {
  const traceParent = response.headers.get(TRACE_PARENT_HEADER);

  if (isValidTraceParent(traceParent)) {
    storeSessionTraceParent(traceParent);

    return;
  }

  const traceId = response.headers.get(TRACE_ID_HEADER)?.trim() ?? "";

  if (/^[0-9a-f]{32}$/i.test(traceId)) {
    storeSessionTraceParent(`00-${traceId.toLowerCase()}-0000000000000001-01`);
  }
}

export function applyTraceParentHeader(headers: Headers): void {
  const traceParent = readSessionTraceParent();

  if (traceParent !== null) {
    headers.set(TRACE_PARENT_HEADER, traceParent);
  }
}
