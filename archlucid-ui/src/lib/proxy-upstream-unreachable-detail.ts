/**
 * Builds operator-facing detail when the UI BFF cannot complete an upstream ArchLucid.Api fetch.
 * Includes method, path, and budget so triage does not require scraping proxy logs.
 */

export type ProxyUpstreamFetchFailureInput = {
  readonly method: string;
  readonly path: string;
  readonly timeoutMs: number;
  readonly causeMessage: string;
};

/** True when the fetch failure looks like AbortSignal.timeout / undici timeout abort. */
export function isProxyUpstreamTimeoutFailure(causeMessage: string): boolean {
  const normalized = causeMessage.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return (
    normalized.includes("aborted due to timeout") ||
    (normalized.includes("timeout") && normalized.includes("abort")) ||
    normalized === "the operation was aborted" ||
    normalized.includes("timed out")
  );
}

/**
 * Prefer a path-aware timeout sentence; otherwise echo the raw cause with method/path context.
 */
export function formatProxyUpstreamUnreachableDetail(input: ProxyUpstreamFetchFailureInput): string {
  const method = input.method.trim().toUpperCase() || "UNKNOWN";
  const path = input.path.trim().length > 0 ? input.path.trim() : "_";
  const cause = input.causeMessage.trim().length > 0 ? input.causeMessage.trim() : "Unknown transport error";
  const timeoutSeconds = Math.round(input.timeoutMs / 1000);

  if (isProxyUpstreamTimeoutFailure(cause)) {
    return (
      `${method} /${path} timed out after ${timeoutSeconds}s ` +
      `(UI BFF proxy → ArchLucid.Api; budget ${input.timeoutMs}ms). Cause: ${cause}`
    );
  }

  return `${method} /${path} failed (UI BFF proxy → ArchLucid.Api). Cause: ${cause}`;
}
