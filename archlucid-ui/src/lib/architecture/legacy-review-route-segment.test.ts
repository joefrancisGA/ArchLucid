import { describe, expect, it } from "vitest";

import {
  CANONICAL_REVIEW_DETAIL_PATH_PREFIX,
  LEGACY_REVIEW_DETAIL_ROUTE_SEGMENT,
  LEGACY_RUN_DETAIL_PATH_PREFIX,
  REVIEW_DETAIL_ROUTE_PATTERN,
  REVIEW_DETAIL_ROUTE_SEGMENT,
} from "@/lib/architecture/legacy-review-route-segment";
import { BOOKMARK_PERMANENT_REDIRECTS } from "@/lib/next/bookmark-permanent-redirects";

describe("legacy-review-route-segment (TB-2234)", () => {
  it("uses reviewId as the canonical App Router dynamic segment", () => {
    expect(REVIEW_DETAIL_ROUTE_SEGMENT).toBe("reviewId");
    expect(REVIEW_DETAIL_ROUTE_PATTERN).toBe("/architecture/reviews/[reviewId]");
    expect(LEGACY_REVIEW_DETAIL_ROUTE_SEGMENT).toBe("runId");
  });

  it("ships permanent redirects from legacy /runs bookmarks", () => {
    const sources = BOOKMARK_PERMANENT_REDIRECTS.map((rule) => rule.source);

    expect(sources).toContain("/runs/:reviewId");
    expect(sources).toContain("/runs/:reviewId/:path*");

    const listRedirect = BOOKMARK_PERMANENT_REDIRECTS.find((rule) => rule.source === "/runs/:reviewId");

    expect(listRedirect?.destination).toBe(`${CANONICAL_REVIEW_DETAIL_PATH_PREFIX}/:reviewId`);
    expect(LEGACY_RUN_DETAIL_PATH_PREFIX).toBe("/runs");
  });
});
