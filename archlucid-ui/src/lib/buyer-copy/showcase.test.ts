import { describe, expect, it } from "vitest";

import {
  BUYER_SHOWCASE_APPROVAL_UTC,
  resolveBuyerShowcaseResidualRiskNextReviewIso,
} from "@/lib/buyer-copy/showcase";

describe("resolveBuyerShowcaseResidualRiskNextReviewIso", () => {
  it("returns the first review one month after approval when still upcoming", () => {
    expect(resolveBuyerShowcaseResidualRiskNextReviewIso(new Date("2026-02-01T12:00:00Z"))).toBe("2026-02-14");
  });

  it("rolls forward annually after the first review date passes", () => {
    expect(resolveBuyerShowcaseResidualRiskNextReviewIso(new Date("2026-08-22T12:00:00Z"))).toBe("2027-02-14");
    expect(resolveBuyerShowcaseResidualRiskNextReviewIso(new Date("2027-06-01T12:00:00Z"))).toBe("2028-02-14");
  });

  it("keeps the scheduled date on the review day itself", () => {
    expect(resolveBuyerShowcaseResidualRiskNextReviewIso(new Date("2027-02-14T23:59:59Z"))).toBe("2027-02-14");
  });

  it("anchors the first review to approval plus one month", () => {
    const approval = new Date(BUYER_SHOWCASE_APPROVAL_UTC);
    const firstReview = new Date(approval);

    firstReview.setUTCMonth(firstReview.getUTCMonth() + 1);
    firstReview.setUTCHours(0, 0, 0, 0);

    const expected = `${firstReview.getUTCFullYear()}-${String(firstReview.getUTCMonth() + 1).padStart(2, "0")}-${String(
      firstReview.getUTCDate(),
    ).padStart(2, "0")}`;

    expect(resolveBuyerShowcaseResidualRiskNextReviewIso(new Date("2026-01-20T12:00:00Z"))).toBe(expected);
  });
});
