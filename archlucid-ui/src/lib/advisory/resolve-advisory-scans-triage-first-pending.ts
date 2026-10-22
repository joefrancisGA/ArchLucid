import type { RecommendationRecord } from "@/types/advisory";

export type AdvisoryScansTriageFirstPendingTarget = {
  readonly recommendationId: string;
  readonly title: string;
  readonly runId: string;
  readonly createdUtc: string;
};

function isPendingRecommendationStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();

  return (
    normalized === "open"
    || normalized === "pending"
    || normalized === "submitted"
    || normalized === "inreview"
  );
}

/** Oldest pending advisory recommendation for triage-first guidance. */
export function resolveAdvisoryScansTriageFirstPending(
  recommendations: readonly RecommendationRecord[],
): AdvisoryScansTriageFirstPendingTarget | null {
  const pendingRecommendations = recommendations.filter((row) => isPendingRecommendationStatus(row.status));

  if (pendingRecommendations.length === 0) {
    return null;
  }

  const sorted = [...pendingRecommendations].sort((left, right) => {
    const leftCreated = Date.parse(left.createdUtc);
    const rightCreated = Date.parse(right.createdUtc);

    if (Number.isNaN(leftCreated) && Number.isNaN(rightCreated)) {
      return left.recommendationId.localeCompare(right.recommendationId);
    }

    if (Number.isNaN(leftCreated)) {
      return 1;
    }

    if (Number.isNaN(rightCreated)) {
      return -1;
    }

    return leftCreated - rightCreated;
  });

  const first = sorted[0];

  if (first === undefined) {
    return null;
  }

  return {
    recommendationId: first.recommendationId,
    title: first.title,
    runId: first.runId,
    createdUtc: first.createdUtc,
  };
}
