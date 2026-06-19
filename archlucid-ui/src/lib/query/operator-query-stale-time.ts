/** Shared stale window for operator shell status queries (trial, health, budget, usage). */
export const OPERATOR_QUERY_STALE_MS = 60_000;

/** Keep inactive shell queries in memory for five minutes before garbage collection. */
export const OPERATOR_QUERY_GC_MS = 5 * 60_000;
