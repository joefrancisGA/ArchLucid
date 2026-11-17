import { describe, expect, it } from "vitest";

import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";

describe("governance standards scoped Open review", () => {
  it("uses nested review open when architecture id is known", () => {
    expect(resolveScopedInsightOpenReviewHrefWithDeskContinuity("run-1", { architectureId: "architecture-identity-001" })).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-1",
    );
  });
});
