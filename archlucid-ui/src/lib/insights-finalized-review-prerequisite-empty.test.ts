import { describe, expect, it } from "vitest";

import {
  buildInsightsFinalizedReviewPrerequisiteEmpty,
  INSIGHTS_COMPARE_PREREQUISITE_OPEN_REVIEWS_HINT,
} from "./insights-finalized-review-prerequisite-empty";

describe("insights-finalized-review-prerequisite-empty", () => {
  it("names the open reviews hint on compare zero-finalized empty", () => {
    const preset = buildInsightsFinalizedReviewPrerequisiteEmpty({ jobId: "compare", finalizedCount: 0 });

    expect(preset.description).toContain(INSIGHTS_COMPARE_PREREQUISITE_OPEN_REVIEWS_HINT);
    expect(preset.testId).toBe("compare-zero-finalized-empty-state");
  });
});
