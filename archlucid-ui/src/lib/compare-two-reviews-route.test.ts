import { describe, expect, it } from "vitest";

import {
  buildCompareTwoReviewsHref,
  readReviewRunIdFromPathname,
} from "@/lib/compare-two-reviews-route";
import { readCompareRunIdsFromSearchParams } from "@/lib/compare-url-query-params";

describe("compare-two-reviews-route", () => {
  it("buildCompareTwoReviewsHref prefills the base run id", () => {
    expect(buildCompareTwoReviewsHref({ baseRunId: "run-abc" })).toBe(
      "/insights/compare-two-reviews?priorRunId=run-abc",
    );
  });

  it("buildCompareTwoReviewsHref scopes compare to an architecture when provided", () => {
    expect(
      buildCompareTwoReviewsHref({ baseRunId: "run-abc", architectureId: "arch-1" }),
    ).toBe("/insights/compare-two-reviews?priorRunId=run-abc&architectureId=arch-1");
  });

  it("buildCompareTwoReviewsHref omits query for empty base ids", () => {
    expect(buildCompareTwoReviewsHref({ baseRunId: "" })).toBe("/insights/compare-two-reviews");
    expect(buildCompareTwoReviewsHref({ baseRunId: "   " })).toBe("/insights/compare-two-reviews");
  });

  it("buildCompareTwoReviewsHref does not prefill the against side for in-flight reviews", () => {
    const href = buildCompareTwoReviewsHref({ baseRunId: "in-flight-run" });

    expect(href).toContain("priorRunId=in-flight-run");
    expect(href).not.toContain("laterRunId=");
    expect(href).not.toContain("rightRunId=");

    const params = new URLSearchParams(href.split("?")[1] ?? "");
    expect(readCompareRunIdsFromSearchParams(params)).toEqual({ prior: "in-flight-run", later: "" });
  });

  it("readReviewRunIdFromPathname extracts review id from review-detail paths", () => {
    expect(readReviewRunIdFromPathname("/architecture/reviews/run-abc")).toBe("run-abc");
    expect(readReviewRunIdFromPathname("/architecture/reviews/run-abc?reviewTab=findings")).toBe("run-abc");
    expect(readReviewRunIdFromPathname("/architecture/reviews")).toBeNull();
  });
});
