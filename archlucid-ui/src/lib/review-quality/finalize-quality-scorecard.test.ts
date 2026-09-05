import { describe, expect, it } from "vitest";

import { evaluateFinalizeQualityScorecard } from "./finalize-quality-scorecard";

describe("finalize-quality-scorecard transparency trail (LK-09)", () => {
  it("blocks finalize when transparency trail is incomplete", () => {
    const result = evaluateFinalizeQualityScorecard({
      blockingFindingCount: 0,
      unverifiedAssumptionCount: 0,
      unacknowledgedExistentialAssumptionCount: 0,
      uncoveredMandatoryRequirementCount: 0,
      openCannotDetermineCount: 0,
      lowExtractionConfidenceCount: 0,
      unresolvedHighSeverityDispositionCount: 0,
      skippedMustCount: 0,
      transparencyTrailIncomplete: true,
    });

    expect(result.ready).toBe(false);
    expect(result.blockingReasons.some((reason) => reason.toLowerCase().includes("transparency trail"))).toBe(
      true,
    );
  });
});
