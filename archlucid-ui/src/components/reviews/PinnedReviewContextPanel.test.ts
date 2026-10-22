import { describe, expect, it } from "vitest";

import { formatPinnedReviewFindingsCount } from "@/components/reviews/PinnedReviewContextPanel";

describe("PinnedReviewContextPanel findings count", () => {
  it("distinguishes missing counts from stored zero", () => {
    expect(formatPinnedReviewFindingsCount(null)).toBe("Findings count was not returned.");
    expect(formatPinnedReviewFindingsCount(0)).toBe("0 assessment findings");
    expect(formatPinnedReviewFindingsCount(1)).toBe("1 assessment finding");
  });
});
