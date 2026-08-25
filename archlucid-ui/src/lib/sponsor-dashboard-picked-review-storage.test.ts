import { beforeEach, describe, expect, it } from "vitest";

import {
  readSponsorDashboardPickedReviewId,
  SPONSOR_DASHBOARD_PICKED_REVIEW_STORAGE_KEY,
  writeSponsorDashboardPickedReviewId,
} from "@/lib/sponsor-dashboard-picked-review-storage";

describe("sponsor-dashboard-picked-review-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips picked review id", () => {
    writeSponsorDashboardPickedReviewId("run-sponsor-1");

    expect(readSponsorDashboardPickedReviewId()).toBe("run-sponsor-1");
    expect(window.localStorage.getItem(SPONSOR_DASHBOARD_PICKED_REVIEW_STORAGE_KEY)).toBe("run-sponsor-1");
  });
});
