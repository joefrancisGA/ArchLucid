import { describe, expect, it } from "vitest";

import {
  IMPACT_PREVIEW_RECOMMENDATION_DO_NOT_PROCEED,
  IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW,
  IMPACT_PREVIEW_RECOMMENDATION_PROCEED,
  IMPACT_PREVIEW_RECOMMENDATION_PROCEED_MONITORING,
} from "@/lib/impact-preview-page-copy";
import { resolveImpactPreviewPageState } from "@/lib/resolve-impact-preview-page-state";
import { resolveImpactPreviewRecommendation } from "@/lib/resolve-impact-preview-recommendation";

describe("resolveImpactPreviewPageState", () => {
  it("returns permission_denied for 403 list failures", () => {
    expect(
      resolveImpactPreviewPageState({
        candidateCount: 0,
        listLoading: false,
        listFailure: { message: "Forbidden", problem: null, correlationId: null, httpStatus: 403, retryAfterSeconds: null },
        baselineLoading: false,
        finalizedBaselineCount: 0,
      }),
    ).toBe("permission_denied");
  });

  it("returns no_baseline when no finalized reviews exist", () => {
    expect(
      resolveImpactPreviewPageState({
        candidateCount: 2,
        listLoading: false,
        listFailure: null,
        baselineLoading: false,
        finalizedBaselineCount: 0,
      }),
    ).toBe("no_baseline");
  });

  it("returns no_candidates when baselines exist but no proposed changes", () => {
    expect(
      resolveImpactPreviewPageState({
        candidateCount: 0,
        listLoading: false,
        listFailure: null,
        baselineLoading: false,
        finalizedBaselineCount: 2,
      }),
    ).toBe("no_candidates");
  });
});

describe("resolveImpactPreviewRecommendation", () => {
  it("recommends proceed when improvement delta is positive and risk is low", () => {
    expect(
      resolveImpactPreviewRecommendation({
        improvementDelta: 0.4,
        regressionRiskScore: 0.1,
        regressionSignals: [],
      }),
    ).toBe(IMPACT_PREVIEW_RECOMMENDATION_PROCEED);
  });

  it("recommends do not proceed when regression signals are present", () => {
    expect(
      resolveImpactPreviewRecommendation({
        improvementDelta: 0.2,
        regressionRiskScore: 0.1,
        regressionSignals: ["finding-regression"],
      }),
    ).toBe(IMPACT_PREVIEW_RECOMMENDATION_DO_NOT_PROCEED);
  });

  it("recommends proceed with monitoring for moderate regression risk", () => {
    expect(
      resolveImpactPreviewRecommendation({
        improvementDelta: 0.3,
        regressionRiskScore: 0.25,
        regressionSignals: [],
      }),
    ).toBe(IMPACT_PREVIEW_RECOMMENDATION_PROCEED_MONITORING);
  });

  it("defaults to needs review without scores", () => {
    expect(resolveImpactPreviewRecommendation(null)).toBe(IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW);
  });
});
