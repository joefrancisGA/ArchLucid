import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import type { RunSummary } from "@/types/authority";

export type RunDetailNextReviewTarget = {
  readonly runId: string;
  readonly reviewTitle: string;
  readonly href: string;
};

/** Next review in list order after the current run id. */
export function resolveNextRunsListRow(
  runs: readonly RunSummary[],
  currentRunId: string,
): RunDetailNextReviewTarget | null {
  const normalizedCurrentId = currentRunId.trim();
  const sorted = [...runs].sort((left, right) => right.createdUtc.localeCompare(left.createdUtc));
  const currentIndex = sorted.findIndex((run) => run.runId === normalizedCurrentId);

  if (currentIndex < 0) {
    return null;
  }

  const nextRun = sorted[currentIndex + 1];

  if (nextRun === undefined) {
    return null;
  }

  return {
    runId: nextRun.runId,
    reviewTitle: buyerFacingReviewTitleFromSummary(nextRun),
    href: `/architecture/reviews/${encodeURIComponent(nextRun.runId)}`,
  };
}
