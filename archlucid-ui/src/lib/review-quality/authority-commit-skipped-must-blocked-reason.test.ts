import { describe, expect, it } from "vitest";

import { formatAuthorityCommitSkippedMustBlockedReason } from "@/lib/review-quality/authority-commit-skipped-must-blocked-reason";
import { evaluateFinalizeQualityScorecard } from "@/lib/review-quality/finalize-quality-scorecard";

const BASE_INPUT = {
  blockingFindingCount: 0,
  unverifiedAssumptionCount: 0,
  unacknowledgedExistentialAssumptionCount: 0,
  uncoveredMandatoryRequirementCount: 0,
  openCannotDetermineCount: 0,
  lowExtractionConfidenceCount: 0,
  unresolvedHighSeverityDispositionCount: 0,
};

describe("authority-commit-skipped-must-blocked-reason", () => {
  it("uses singular copy for one skipped MUST", () => {
    expect(formatAuthorityCommitSkippedMustBlockedReason(1)).toBe("1 required question is unanswered.");
  });

  it("uses plural copy for multiple skipped MUST questions", () => {
    expect(formatAuthorityCommitSkippedMustBlockedReason(2)).toBe("2 required questions are unanswered.");
  });

  it("matches finalize scorecard blocked reason", () => {
    const scorecard = evaluateFinalizeQualityScorecard({
      ...BASE_INPUT,
      skippedMustCount: 2,
    });

    expect(scorecard.ready).toBe(false);
    expect(scorecard.blockingReasons).toContain(formatAuthorityCommitSkippedMustBlockedReason(2));
  });
});
