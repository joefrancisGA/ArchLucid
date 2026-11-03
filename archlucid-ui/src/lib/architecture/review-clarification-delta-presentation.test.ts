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

  it("labels missing delta when a prior run id was stored", () => {
    expect(
      buildReviewClarificationDeltaPresentation(null, { priorRunId: "prior-run" }).summary,
    ).toBe("Clarification delta from the prior review was not stored.");
  });

  it("adds a capped-list disclaimer when stored question ids exceed the strip cap", () => {
    const delta = {
      resolvedByEvidenceQuestionIds: Array.from({ length: 12 }, (_, index) => `evidence-${index}`),
      resolvedByAssertionQuestionIds: Array.from({ length: 12 }, (_, index) => `assertion-${index}`),
      stillOpenQuestionIds: [],
    };

    expect(buildReviewClarificationDeltaPresentation(delta).cappedListDisclaimer).toBe(
      "4 additional stored question ids are not listed in this delta strip.",
    );
  });
});
