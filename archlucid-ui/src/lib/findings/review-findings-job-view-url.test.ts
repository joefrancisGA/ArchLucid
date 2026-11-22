import { describe, expect, it } from "vitest";

import {
  buildReviewFindingsTabHref,
  resolveFindingJobViewFromSearchParam,
} from "@/lib/findings/review-findings-job-view-url";

describe("review-findings-job-view-url", () => {
  it("builds findings tab href with job view param when not default", () => {
    expect(buildReviewFindingsTabHref("run-1", "verify-hypotheses")).toBe(
      "/architecture/reviews/run-1?reviewTab=findings&findingJobView=verify-hypotheses",
    );
  });

  it("omits job view param for default lane", () => {
    expect(buildReviewFindingsTabHref("run-1", "needs-my-decision")).toBe(
      "/architecture/reviews/run-1?reviewTab=findings",
    );
  });

  it("falls back to default for unknown search param values", () => {
    expect(resolveFindingJobViewFromSearchParam("not-a-lane")).toBe("needs-my-decision");
    expect(resolveFindingJobViewFromSearchParam("verify-hypotheses")).toBe("verify-hypotheses");
  });
});
