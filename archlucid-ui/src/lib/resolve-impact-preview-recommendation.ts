import {
  IMPACT_PREVIEW_RECOMMENDATION_DO_NOT_PROCEED,
  IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW,
  IMPACT_PREVIEW_RECOMMENDATION_PROCEED,
  IMPACT_PREVIEW_RECOMMENDATION_PROCEED_MONITORING,
} from "@/lib/impact-preview-page-copy";
import type { ImpactPreviewRecommendation } from "@/lib/impact-preview-page-types";
import type { EvaluationScoreResponse } from "@/types/evolution";

/** Derives a buyer-safe recommendation label from evaluation scores. */
export function resolveImpactPreviewRecommendation(
  evaluation: EvaluationScoreResponse | null | undefined,
): ImpactPreviewRecommendation {
  if (evaluation === null || evaluation === undefined) {
    return IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW;
  }

  const regressionSignals = evaluation.regressionSignals ?? [];
  const regressionRisk = evaluation.regressionRiskScore ?? null;
  const improvementDelta = evaluation.improvementDelta ?? null;

  if (regressionSignals.length > 0 || (regressionRisk !== null && regressionRisk >= 0.7)) {
    return IMPACT_PREVIEW_RECOMMENDATION_DO_NOT_PROCEED;
  }

  if (regressionRisk !== null && regressionRisk >= 0.4) {
    return IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW;
  }

  if (improvementDelta !== null && improvementDelta > 0) {
    if (regressionRisk !== null && regressionRisk >= 0.2) {
      return IMPACT_PREVIEW_RECOMMENDATION_PROCEED_MONITORING;
    }

    return IMPACT_PREVIEW_RECOMMENDATION_PROCEED;
  }

  return IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW;
}
