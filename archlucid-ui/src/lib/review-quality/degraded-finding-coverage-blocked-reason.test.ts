import { describe, expect, it } from "vitest";

import { formatDegradedFindingCoverageBlockedReason } from "./degraded-finding-coverage-blocked-reason";
import { evaluateFinalizeQualityScorecard } from "./finalize-quality-scorecard";

describe("degraded finding coverage finalize block (WS-14)", () => {
  it("blocks Working finalize when coverage is degraded", () => {
    const result = evaluateFinalizeQualityScorecard({
      blockingFindingCount: 0,
      unverifiedAssumptionCount: 0,
      unacknowledgedExistentialAssumptionCount: 0,
      uncoveredMandatoryRequirementCount: 0,
      openCannotDetermineCount: 0,
      lowExtractionConfidenceCount: 0,
      unresolvedHighSeverityDispositionCount: 0,
      skippedMustCount: 0,
      degradedFindingCoverage: true,
      degradedFindingCoverageFailedEngineLabels: ["PolicyEngine/Security"],
      blockDegradedFindingCoverageOnWorking: true,
    });

    expect(result.ready).toBe(false);
    expect(result.blockingReasons).toContain(
      formatDegradedFindingCoverageBlockedReason(["PolicyEngine/Security"]),
    );
  });

  it("does not block Guided/demo when Working block flag is off", () => {
    const result = evaluateFinalizeQualityScorecard({
      blockingFindingCount: 0,
      unverifiedAssumptionCount: 0,
      unacknowledgedExistentialAssumptionCount: 0,
      uncoveredMandatoryRequirementCount: 0,
      openCannotDetermineCount: 0,
      lowExtractionConfidenceCount: 0,
      unresolvedHighSeverityDispositionCount: 0,
      skippedMustCount: 0,
      degradedFindingCoverage: true,
      degradedFindingCoverageFailedEngineLabels: ["PolicyEngine/Security"],
      blockDegradedFindingCoverageOnWorking: false,
    });

    expect(result.ready).toBe(true);
  });
});
