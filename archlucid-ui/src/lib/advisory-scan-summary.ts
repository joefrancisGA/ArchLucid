import type { ImprovementPlan, RecommendationRecord } from "@/types/advisory";

export type AdvisoryScanSummary = {
  readonly recommendationsGenerated: number;
  readonly highImpactCount: number;
  readonly accepted: number;
  readonly deferred: number;
  readonly rejected: number;
  readonly implemented: number;
  readonly proposed: number;
  readonly lastScanUtc: string | null;
  readonly comparedToRunId: string | null;
};

function isHighImpactRecommendation(rec: RecommendationRecord): boolean {
  const impact = rec.expectedImpact.toLowerCase();
  const urgency = rec.urgency.toLowerCase();

  return impact.includes("high") || urgency.includes("high") || urgency.includes("critical");
}

function countByStatus(recommendations: readonly RecommendationRecord[], status: string): number {
  return recommendations.filter((rec) => rec.status.toLowerCase() === status.toLowerCase()).length;
}

function resolveLastScanUtc(
  planSummary: ImprovementPlan | null,
  recommendations: readonly RecommendationRecord[],
): string | null {
  if (planSummary !== null && planSummary.generatedUtc.trim().length > 0) {
    return planSummary.generatedUtc;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return recommendations
    .map((rec) => rec.lastUpdatedUtc)
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function resolveComparedToRunId(
  planSummary: ImprovementPlan | null,
  recommendations: readonly RecommendationRecord[],
  explicitCompareToRunId: string,
): string | null {
  const fromPlan = planSummary?.comparedToRunId?.trim();

  if (fromPlan !== undefined && fromPlan !== null && fromPlan.length > 0) {
    return fromPlan;
  }

  const explicit = explicitCompareToRunId.trim();

  if (explicit.length > 0) {
    return explicit;
  }

  const fromRec = recommendations.find((rec) => {
    const baseline = rec.comparedToRunId?.trim();

    return baseline !== undefined && baseline !== null && baseline.length > 0;
  })?.comparedToRunId;

  if (fromRec === undefined || fromRec === null) {
    return null;
  }

  const trimmed = fromRec.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/** Aggregates scan outcome counts for the advisory scans summary panel. */
export function buildAdvisoryScanSummary(
  recommendations: readonly RecommendationRecord[],
  planSummary: ImprovementPlan | null,
  explicitCompareToRunId: string,
): AdvisoryScanSummary {
  return {
    recommendationsGenerated: recommendations.length,
    highImpactCount: recommendations.filter(isHighImpactRecommendation).length,
    accepted: countByStatus(recommendations, "Accepted"),
    deferred: countByStatus(recommendations, "Deferred"),
    rejected: countByStatus(recommendations, "Rejected"),
    implemented: countByStatus(recommendations, "Implemented"),
    proposed: countByStatus(recommendations, "Proposed"),
    lastScanUtc: resolveLastScanUtc(planSummary, recommendations),
    comparedToRunId: resolveComparedToRunId(planSummary, recommendations, explicitCompareToRunId),
  };
}
