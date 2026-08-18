import { describe, expect, it } from "vitest";

import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";
import {
  BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE,
  BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE,
  BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE,
  reviewsNewPageSubtitle,
} from "@/lib/reviews-new-page-copy";

describe("reviews-new-page-copy", () => {
  it("returns path-tab buyer subtitles for detailed, guided-intake, and quick-review modes", () => {
    expect(BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE).toBe(REVIEWS_NEW_PATH_HINTS.detailed);
    expect(BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE).toBe(REVIEWS_NEW_PATH_HINTS["guided-intake"]);
    expect(BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE).toBe(REVIEWS_NEW_PATH_HINTS["quick-review"]);
    expect(reviewsNewPageSubtitle(true, "detailed")).toBe(BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE);
    expect(reviewsNewPageSubtitle(true, "guided-intake")).toBe(BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE);
    expect(reviewsNewPageSubtitle(true, "quick-review")).toBe(BUYER_REVIEWS_NEW_QUICK_REVIEW_PAGE_SUBTITLE);
  });

  it("keeps the hub lead when no path tab is active", () => {
    expect(reviewsNewPageSubtitle(true, null)).toBe(REVIEWS_NEW_PAGE_LEAD);
  });
});
