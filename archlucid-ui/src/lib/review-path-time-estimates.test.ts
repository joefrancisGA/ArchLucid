import { describe, expect, it } from "vitest";

import { formatReviewPathTimeEstimate, reviewPathTimeEstimate } from "@/lib/review-path-time-estimates";

describe("review-path-time-estimates", () => {
  it("formats quick review estimate", () => {
    expect(formatReviewPathTimeEstimate("quick-review")).toContain("2–5 min");
  });

  it("falls back to quick review for unknown path", () => {
    expect(reviewPathTimeEstimate("quick-review").pathId).toBe("quick-review");
  });
});
