import { describe, expect, it } from "vitest";

import { deriveReviewDoThisNextRecommendedActionCountLabel } from "./review-presentation";

describe("deriveReviewDoThisNextRecommendedActionCountLabel", () => {
  it("does not imply listed actions when count is zero", () => {
    expect(
      deriveReviewDoThisNextRecommendedActionCountLabel({
        recommendedActions: [],
        hasFindingsSnapshot: true,
      }),
    ).toBe("No do-this-next actions are listed for this review.");
  });
});
