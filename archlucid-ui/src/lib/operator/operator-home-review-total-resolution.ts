import type { RunSummary } from "@/types/authority";

/** Non-archived rows on the current overview page — stale-total uplift must not count sealed/archived rows. */
export function countNonArchivedOverviewRuns(items: readonly RunSummary[]): number {
  let count = 0;

  for (const run of items) {
    if (run.isArchived !== true) {
      count += 1;
    }
  }

  return count;
}

/** Aligns live dashboard totals with workspace metrics when API metadata is stale or undercounted. */
export function resolveOperatorHomeReviewTotalCount(
  reportedTotalCount: number,
  ssrTotalCount: number,
  visibleNonArchivedItemCount: number,
): number {
  const normalizedSsrTotal = Number.isFinite(ssrTotalCount) ? Math.max(0, Math.trunc(ssrTotalCount)) : 0;
  const reportedTotalIsFinite = Number.isFinite(reportedTotalCount);

  const resolved = reportedTotalIsFinite
    ? Math.max(0, Math.trunc(reportedTotalCount))
    : normalizedSsrTotal;

  if (visibleNonArchivedItemCount > 0) {
    const upliftedTotal = Math.max(visibleNonArchivedItemCount, normalizedSsrTotal);

    if (!reportedTotalIsFinite || reportedTotalCount === 0) {
      return Math.max(upliftedTotal, resolved);
    }

    if (reportedTotalCount > 0 && resolved < visibleNonArchivedItemCount) {
      return Math.max(upliftedTotal, resolved);
    }
  }

  return resolved;
}
