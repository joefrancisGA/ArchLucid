import { describe, expect, it } from "vitest";

import { REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";
import {
  BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE,
  BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE,
  reviewsNewPageSubtitle,
} from "@/lib/reviews-new-page-copy";

describe("reviews-new-page-copy", () => {
  it("returns path-tab buyer subtitles for detailed and guided-intake modes", () => {
    expect(BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE).toBe(REVIEWS_NEW_PATH_HINTS.detailed);
    expect(BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE).toBe(REVIEWS_NEW_PATH_HINTS["guided-intake"]);
    expect(reviewsNewPageSubtitle(true, "detailed")).toBe(BUYER_REVIEWS_NEW_DETAILED_PAGE_SUBTITLE);
    expect(reviewsNewPageSubtitle(true, "guided-intake")).toBe(BUYER_REVIEWS_NEW_GUIDED_INTAKE_PAGE_SUBTITLE);
  });
});
