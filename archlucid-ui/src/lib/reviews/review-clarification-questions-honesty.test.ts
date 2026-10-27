import { describe, expect, it } from "vitest";

import {
  CLARIFICATION_QUESTIONS_NOT_STORED_LABEL,
  CLARIFICATION_QUESTIONS_STORED_EMPTY_LABEL,
  describeClarificationQuestionsLoadState,
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
});
