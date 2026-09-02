import type { components } from "@/lib/openapi-schemas";
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
  evaluation:
    | EvaluationScoreResponse
    | components["schemas"]["EvaluationScoreResponse"]
    | null
    | undefined,
): ImpactPreviewRecommendation {
  if (evaluation === null || evaluation === undefined) {
    return IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW;
  }

  const regressionSignals = evaluation.regressionSignals ?? [];
  const regressionRisk =
    typeof evaluation.regressionRiskScore === "number"
      ? evaluation.regressionRiskScore
      : evaluation.regressionRiskScore === null || evaluation.regressionRiskScore === undefined
        ? null
        : Number(evaluation.regressionRiskScore);
  const improvementDelta =
    typeof evaluation.improvementDelta === "number"
      ? evaluation.improvementDelta
      : evaluation.improvementDelta === null || evaluation.improvementDelta === undefined
        ? null
        : Number(evaluation.improvementDelta);

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
