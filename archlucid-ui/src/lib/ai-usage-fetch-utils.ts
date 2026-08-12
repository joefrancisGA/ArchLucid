/** Slow-load messaging when AI usage dashboards stall (ADI /administration/ai-usage). */
export const AI_USAGE_COST_REPORTING_SLOW_LOAD_MS = 8_000;

/** Client abort for the three parallel AI usage page fetches (matches proxy upstream ceiling). */
export const AI_USAGE_PAGE_FETCH_TIMEOUT_MS = 60_000;

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  return false;
}

export function pickOptionalAsOfUtc(root: Record<string, unknown>): string | null {
  for (const key of ["asOfUtc", "asOf", "generatedAtUtc", "generatedAt"] as const) {
    const value = root[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}
