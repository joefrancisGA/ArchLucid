import { describe, expect, it } from "vitest";

import { formatReviewPathTimeEstimate, reviewPathTimeEstimate } from "@/lib/review-path-time-estimates";

describe("review-path-time-estimates", () => {
  it("formats quick review estimate", () => {
    const estimate = formatReviewPathTimeEstimate("quick-review");
    expect(estimate).toContain("2–5 min");
    expect(estimate).toContain("to start a review");
    expect(estimate).not.toContain("pipeline execution");
  });

  it("falls back to quick review for unknown path", () => {
    expect(reviewPathTimeEstimate("quick-review").pathId).toBe("quick-review");
  });
});
