import { describe, expect, it } from "vitest";

import {
  buildCompareTwoReviewsHref,
  readReviewRunIdFromPathname,
} from "@/lib/compare-two-reviews-route";

describe("compare-two-reviews-route", () => {
  it("buildCompareTwoReviewsHref prefills the base run id", () => {
    expect(buildCompareTwoReviewsHref({ baseRunId: "run-abc" })).toBe(
      "/insights/compare-two-reviews?priorRunId=run-abc",
    );
  });

  it("readReviewRunIdFromPathname extracts review id from review-detail paths", () => {
    expect(readReviewRunIdFromPathname("/architecture/reviews/run-abc")).toBe("run-abc");
    expect(readReviewRunIdFromPathname("/architecture/reviews/run-abc?reviewTab=findings")).toBe("run-abc");
    expect(readReviewRunIdFromPathname("/architecture/reviews")).toBeNull();
  });
});
