import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  countRunsMatchingInventoryFilter,
  matchesFilter,
  parseReviewsHubInventoryFilter,
  mergeRunsWithArchivedCache,
  resolveInventoryFilterCountRuns,
  parseReviewsHubInventorySearchQuery,
  reviewsHubInventoryFilterHref,
  reviewsHubInventoryHrefFromSearch,
  reviewsHubInventoryClearFiltersHrefFromSearch,
  reviewsHubInventorySearchHrefFromSearch,
} from "./reviews-hub-inventory-filters";

function run(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "run-default",
    projectId: "default",
    createdUtc: "2026-01-01T00:00:00Z",
    hasGoldenManifest: true,
    hasFindingsSnapshot: true,
    ...overrides,
  } as RunSummary;
}

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
  it("counts a review updated in the last 14 days even when it was created earlier", () => {
    const now = Date.now();
    const createdUtc = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();
    const lastModifiedUtc = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

    expect(
      matchesFilter(
        run({ createdUtc, lastModifiedUtc }),
        "updated-recently",
        {},
        [],
      ),
    ).toBe(true);
  });
describe("resolveInventoryFilterCountRuns", () => {
  it("keeps the All count on active reviews when the archived view supplies every run", () => {
    const active = run({ runId: "active", isArchived: false });
    const archived = run({ runId: "archived", isArchived: true, hasGoldenManifest: false });
    const merged = [active, archived];
    const allPool = resolveInventoryFilterCountRuns("all", merged, merged);
    const archivedPool = resolveInventoryFilterCountRuns("Archived", merged, merged);

    expect(countRunsMatchingInventoryFilter(allPool, "all", {}, merged)).toBe(1);
    expect(countRunsMatchingInventoryFilter(archivedPool, "Archived", {}, merged)).toBe(1);
  });
});
describe("mergeRunsWithArchivedCache", () => {
  it("replaces a still-listed active row with the cached archived snapshot", () => {
    const active = run({ runId: "run-1", isArchived: false });
    const archived = run({ runId: "run-1", isArchived: true });
    const merged = mergeRunsWithArchivedCache([active], [archived]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.isArchived).toBe(true);
  });
  it("replaces a still-listed active row when only the list run id has surrounding whitespace", () => {
    const active = run({ runId: " run-1 ", isArchived: false });
    const archived = run({ runId: "run-1", isArchived: true });
    const merged = mergeRunsWithArchivedCache([active], [archived]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.runId).toBe("run-1");
    expect(merged[0]?.isArchived).toBe(true);
  });
});
