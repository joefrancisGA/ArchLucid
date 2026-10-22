import { describe, expect, it } from "vitest";

import {
  parseReviewsHubInventoryFilter,
  parseReviewsHubInventorySearchQuery,
  reviewsHubInventoryFilterHref,
  reviewsHubInventoryHrefFromSearch,
  reviewsHubInventoryClearFiltersHrefFromSearch,
  reviewsHubInventorySearchHrefFromSearch,
  countRunsMatchingInventoryFilter,
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

  it("syncs inventory search with ?q=", () => {
    expect(parseReviewsHubInventorySearchQuery("payments")).toBe("payments");
    expect(parseReviewsHubInventorySearchQuery(null)).toBe("");
    expect(reviewsHubInventorySearchHrefFromSearch("filter=Active", "payments")).toBe(
      "/architecture/reviews?filter=Active&q=payments",
    );
    expect(reviewsHubInventorySearchHrefFromSearch("q=old", "")).toBe("/architecture/reviews");
  });

  it("clears filter and search while preserving unrelated query params", () => {
    expect(reviewsHubInventoryClearFiltersHrefFromSearch("projectId=default&filter=Active&q=pay")).toBe(
      "/architecture/reviews?projectId=default",
    );
  });
});
