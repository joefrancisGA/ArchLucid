import { describe, expect, it } from "vitest";

import {
  parseReviewsHubInventoryFilter,
  reviewsHubInventoryFilterHref,
  reviewsHubInventoryHrefFromSearch,
} from "./reviews-hub-inventory-filters";

describe("reviews hub inventory filter URL", () => {
  it("parses known filter ids and falls back to all", () => {
    expect(parseReviewsHubInventoryFilter("needs-attention")).toBe("needs-attention");
    expect(parseReviewsHubInventoryFilter("Awaiting approval")).toBe("Awaiting approval");
    expect(parseReviewsHubInventoryFilter("not-a-filter")).toBe("all");
    expect(parseReviewsHubInventoryFilter(null)).toBe("all");
  });

  it("builds shareable filter hrefs", () => {
    expect(reviewsHubInventoryFilterHref("all")).toBe("/architecture/reviews");
    expect(reviewsHubInventoryFilterHref("needs-attention")).toBe(
      "/architecture/reviews?filter=needs-attention",
    );
    expect(reviewsHubInventoryFilterHref("Awaiting approval")).toBe(
      "/architecture/reviews?filter=Awaiting%20approval",
    );
  });

  it("preserves other query params when writing the filter", () => {
    expect(reviewsHubInventoryHrefFromSearch("q=payments", "finalized")).toBe(
      "/architecture/reviews?q=payments&filter=finalized",
    );
    expect(reviewsHubInventoryHrefFromSearch("filter=Active", "all")).toBe("/architecture/reviews");
  });
});
