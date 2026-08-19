import { describe, expect, it } from "vitest";

import {
  formatFinalizedReviewPackagesOutcome,
  REVIEW_LIFECYCLE_BANNED_COMMITTED_CHROME,
  REVIEW_LIFECYCLE_FINALIZED_STATE_LABEL,
} from "@/lib/vocabulary/review-lifecycle-verb-map";

describe("review-lifecycle-verb-map (TB-2357)", () => {
  it("formats finalized and active counts without committed chrome", () => {
    const line = formatFinalizedReviewPackagesOutcome({ finalizedCount: 2, activeCount: 1 });

    expect(line).toBe("2 finalized · 1 active");
    expect(REVIEW_LIFECYCLE_BANNED_COMMITTED_CHROME.test(line)).toBe(false);
  });

  it("omits active segment when none are active", () => {
    expect(formatFinalizedReviewPackagesOutcome({ finalizedCount: 3, activeCount: 0 })).toBe("3 finalized");
  });

  it("uses Finalized state label constant", () => {
    expect(REVIEW_LIFECYCLE_FINALIZED_STATE_LABEL).toBe("Finalized");
  });
});
