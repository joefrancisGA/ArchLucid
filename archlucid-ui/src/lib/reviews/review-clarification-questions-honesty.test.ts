import { describe, expect, it } from "vitest";

import {
  CLARIFICATION_ANSWER_NOT_STORED_LABEL,
  CLARIFICATION_ANSWER_STORED_EMPTY_LABEL,
  CLARIFICATION_QUESTIONS_NOT_STORED_LABEL,
  CLARIFICATION_QUESTIONS_STORED_EMPTY_LABEL,
  describeClarificationQuestionsLoadState,
  formatGuidedIntakeClarificationAnswerStatus,
} from "@/lib/reviews/review-clarification-questions-honesty";

describe("review-clarification-questions-honesty (P-02)", () => {
  it("distinguishes undefined questions from an empty stored list", () => {
    expect(describeClarificationQuestionsLoadState(undefined)).toBe(CLARIFICATION_QUESTIONS_NOT_STORED_LABEL);
    expect(describeClarificationQuestionsLoadState([])).toBe(CLARIFICATION_QUESTIONS_STORED_EMPTY_LABEL);
    expect(
      describeClarificationQuestionsLoadState([
        {
          questionId: "q1",
          prompt: "Why?",
          sourceFindingId: "f1",
          sourceFindingType: "Gap",
          severity: "Warning",
          missingItem: "Owner",
        },
      ]),
    ).toBeNull();
  });

  it("distinguishes omitted answers from stored-empty answers (P-19)", () => {
    expect(formatGuidedIntakeClarificationAnswerStatus({ storedAnswer: null })).toBe(
      CLARIFICATION_ANSWER_NOT_STORED_LABEL,
    );
    expect(formatGuidedIntakeClarificationAnswerStatus({ storedAnswer: "   " })).toBe(
      CLARIFICATION_ANSWER_STORED_EMPTY_LABEL,
    );
  });
});
