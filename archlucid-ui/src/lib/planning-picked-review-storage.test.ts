import { describe, expect, it } from "vitest";

import {
  PLANNING_PICKED_REVIEW_STORAGE_KEY,
  readPlanningPickedReviewId,
  writePlanningPickedReviewId,
} from "@/lib/planning-picked-review-storage";

describe("planning-picked-review-storage", () => {
  it("round-trips a picked review id", () => {
    window.localStorage.removeItem(PLANNING_PICKED_REVIEW_STORAGE_KEY);
    writePlanningPickedReviewId("run-plan-1");

    expect(readPlanningPickedReviewId()).toBe("run-plan-1");
  });

  it("ignores blank review ids", () => {
    window.localStorage.removeItem(PLANNING_PICKED_REVIEW_STORAGE_KEY);
    writePlanningPickedReviewId("   ");

    expect(readPlanningPickedReviewId()).toBe("");
  });
});
