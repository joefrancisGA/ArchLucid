import { describe, expect, it } from "vitest";

import { evaluateFinalizeQualityScorecard } from "@/lib/review-quality/finalize-quality-scorecard";

describe("finalize-quality-scorecard", () => {
  it("passes when all scorecard inputs are clean", () => {
    const result = evaluateFinalizeQualityScorecard({
      blockingFindingCount: 0,
      unverifiedAssumptionCount: 1,
      unacknowledgedExistentialAssumptionCount: 0,
      uncoveredMandatoryRequirementCount: 0,
      openCannotDetermineCount: 0,
      lowExtractionConfidenceCount: 0,
    });

    expect(result.ready).toBe(true);
    expect(result.blockingReasons).toHaveLength(0);
  });

  it("blocks on uncovered requirements and open questions", () => {
    const result = evaluateFinalizeQualityScorecard({
      blockingFindingCount: 0,
      unverifiedAssumptionCount: 0,
      unacknowledgedExistentialAssumptionCount: 0,
      uncoveredMandatoryRequirementCount: 2,
      openCannotDetermineCount: 1,
      lowExtractionConfidenceCount: 0,
    });

    expect(result.ready).toBe(false);
    expect(result.blockingReasons.length).toBeGreaterThanOrEqual(2);
  });

  it("blocks when existential assumptions are not acknowledged", () => {
    const result = evaluateFinalizeQualityScorecard({
      blockingFindingCount: 0,
      unverifiedAssumptionCount: 1,
      unacknowledgedExistentialAssumptionCount: 1,
      uncoveredMandatoryRequirementCount: 0,
      openCannotDetermineCount: 0,
      lowExtractionConfidenceCount: 0,
    });

    expect(result.ready).toBe(false);
    expect(result.blockingReasons.some((reason) => reason.includes("existential"))).toBe(true);
  });
});
