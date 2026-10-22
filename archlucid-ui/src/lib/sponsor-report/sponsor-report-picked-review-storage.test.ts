import { describe, expect, it } from "vitest";

import {
  readSponsorReportPickedReviewId,
  SPONSOR_REPORT_PICKED_REVIEW_STORAGE_KEY,
  writeSponsorReportPickedReviewId,
} from "@/lib/sponsor-report/sponsor-report-picked-review-storage";

describe("sponsor-report-picked-review-storage", () => {
  it("reads and writes picked review id", () => {
    window.localStorage.removeItem(SPONSOR_REPORT_PICKED_REVIEW_STORAGE_KEY);
    writeSponsorReportPickedReviewId("run-sponsor-1");

    expect(readSponsorReportPickedReviewId()).toBe("run-sponsor-1");
  });
});
