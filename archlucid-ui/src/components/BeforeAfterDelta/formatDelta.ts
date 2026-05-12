/**
 * Pure formatters shared across the three new BeforeAfterDeltaPanel variants
 * (top / sidebar / inline). Kept dependency-free so they can be unit-tested
 * directly from the variant specs without importing React.
 */

const SECONDS_PER_HOUR = 3600;

/** "12.34 h" or em-dash when the input is null / non-finite. */
export function formatHours(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (!Number.isFinite(seconds)) return "—";
  if (seconds < 0) return "—";

  return `${(seconds / SECONDS_PER_HOUR).toFixed(2)} h`;
}

/** "5" / "5.5" — integer formatting unless the median falls between counts. */
export function formatFindings(count: number | null | undefined): string {
  if (count === null || count === undefined) return "—";
  if (!Number.isFinite(count)) return "—";

  return Number.isInteger(count) ? String(count) : count.toFixed(1);
}

/** Median LLM call count — integer when whole, otherwise one decimal (matches findings formatting). */
export function formatMedianLlmCalls(count: number | null | undefined): string {
  return formatFindings(count);
}

/**
 * Symmetric percent-change between two non-negative quantities.
 * `prior` is the "before"; `current` is the "after". Positive percent => improvement
 * (i.e. current is smaller than prior). Returns null when prior is missing or zero
 * so the caller renders "no comparison" instead of "Infinity%".
 */
export function percentDelta(prior: number | null, current: number | null): number | null {
  if (prior === null || current === null) return null;
  if (!Number.isFinite(prior) || !Number.isFinite(current)) return null;
  if (prior <= 0) return null;

  return ((prior - current) / prior) * 100;
}

/** Non-negative window size from recent-deltas payloads — null when missing or non-finite; use `< 1` to hide panels. */
export function safeCommittedRunWindowCount(count: unknown): number | null {
  if (count === null || count === undefined) {
    return null;
  }

  const numeric = typeof count === "number" ? count : Number(count);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return Math.floor(numeric);
}

/** Per-row findings caption for delta lists (never surfaces "NaN finding(s)"). */
export function formatPerRunFindingsLine(totalFindings: unknown): string {
  const numeric = typeof totalFindings === "number" ? totalFindings : Number(totalFindings);
  const formatted = formatFindings(numeric);

  if (formatted === "—") {
    return "Not enough data yet";
  }

  return `${formatted} finding${formatted === "1" ? "" : "s"}`;
}
