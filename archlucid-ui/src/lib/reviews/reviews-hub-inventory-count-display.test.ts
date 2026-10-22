import { describe, expect, it } from "vitest";

import {
  reviewsHubFindingsCountDisplay,
  reviewsHubRiskCountDisplay,
} from "@/lib/reviews/reviews-hub-inventory-count-display";

describe("reviews-hub-inventory-count-display (P-12)", () => {
  it("labels non-finite findings and risk counts as not stored", () => {
    expect(reviewsHubFindingsCountDisplay(null)).toBe("Finding count was not stored.");
    expect(reviewsHubRiskCountDisplay(undefined)).toBe("Risk count was not stored.");
    expect(reviewsHubFindingsCountDisplay(4)).toBe("4");
    expect(reviewsHubRiskCountDisplay(2)).toBe("2");
  });
});
