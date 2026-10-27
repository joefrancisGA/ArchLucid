import { describe, expect, it } from "vitest";

import {
  formatPinnedReviewFindingListTitle,
  formatPinnedReviewFindingsCount,
  formatPinnedReviewPanelTitle,
} from "@/components/reviews/PinnedReviewContextPanel";

describe("PinnedReviewContextPanel findings count", () => {
  it("distinguishes missing counts from stored zero", () => {
    expect(formatPinnedReviewFindingsCount(null)).toBe("Findings count was not returned.");
    expect(formatPinnedReviewFindingsCount(0)).toBe("0 assessment findings");
    expect(formatPinnedReviewFindingsCount(1)).toBe("1 assessment finding");
  });
});

describe("PinnedReviewContextPanel title helpers", () => {
  it("labels missing pinned summary without defaulting to Pinned review", () => {
    expect(formatPinnedReviewPanelTitle(null)).toBe("Pinned review title was not returned.");
  });

  it("labels missing and empty finding titles without using the raw id as the title", () => {
    expect(formatPinnedReviewFindingListTitle(null, "finding-1")).toBe(
      "Finding title was not stored. Finding id: finding-1.",
    );
    expect(formatPinnedReviewFindingListTitle("", "finding-1")).toBe("Finding title was stored empty.");
    expect(formatPinnedReviewFindingListTitle("Ingress exposure", "finding-1")).toBe("Ingress exposure");
  });
});
