import { describe, expect, it } from "vitest";

import {
  ROI_SUMMARY_PICKED_REVIEW_STORAGE_KEY,
  readRoiSummaryPickedReviewId,
  writeRoiSummaryPickedReviewId,
} from "@/lib/roi-summary/roi-summary-picked-review-storage";

describe("roi-summary-picked-review-storage", () => {
  it("round-trips a picked review id", () => {
    window.localStorage.removeItem(ROI_SUMMARY_PICKED_REVIEW_STORAGE_KEY);
    writeRoiSummaryPickedReviewId("run-roi-1");

    expect(readRoiSummaryPickedReviewId()).toBe("run-roi-1");
  });
});
