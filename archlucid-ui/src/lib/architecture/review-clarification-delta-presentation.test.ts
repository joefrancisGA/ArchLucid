import { describe, expect, it } from "vitest";

import { buildReviewClarificationDeltaPresentation } from "@/lib/architecture/review-clarification-delta-presentation";

describe("buildReviewClarificationDeltaPresentation", () => {
  it("keeps null delta silent for panels without a prior review", () => {
    expect(buildReviewClarificationDeltaPresentation(null).summary).toBeNull();
  });

  it("labels an empty stored delta without implying resolved questions", () => {
    expect(
      buildReviewClarificationDeltaPresentation({
        resolvedByEvidenceQuestionIds: [],
        resolvedByAssertionQuestionIds: [],
        stillOpenQuestionIds: [],
      }).summary,
    ).toBe("Clarification carry-forward was stored with no resolved or open questions.");
  });
});
