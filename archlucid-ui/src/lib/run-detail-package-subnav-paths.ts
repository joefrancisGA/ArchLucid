/** Canonical operator review package detail route for a run. */
export function buildRunDetailPackageHref(runId: string): string {
  return `/reviews/${encodeURIComponent(runId.trim())}`;
}

/** Canonical executive summary route for a finalized review package. */
export function buildRunDetailExecutiveSummaryHref(runId: string): string {
  return `/executive/reviews/${encodeURIComponent(runId.trim())}`;
}
