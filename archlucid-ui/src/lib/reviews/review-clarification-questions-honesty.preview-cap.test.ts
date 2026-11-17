import { describe, expect, it } from "vitest";

import {
  CLARIFICATION_COMPLETE_SKIPPED_NO_ANSWER_LABEL,
  formatGuidedIntakeClarificationAnswerStatus,
} from "./review-clarification-questions-honesty";

describe("formatGuidedIntakeClarificationAnswerStatus (P-12)", () => {
  it("labels complete skipped clarifications without stored answers", () => {
    expect(
      formatGuidedIntakeClarificationAnswerStatus({
        markedComplete: true,
        markedSkipped: true,
        storedAnswer: "   ",
      }),
    ).toBe(CLARIFICATION_COMPLETE_SKIPPED_NO_ANSWER_LABEL);
  });
});
