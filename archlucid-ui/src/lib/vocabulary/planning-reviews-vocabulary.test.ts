import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_REVIEWS_HUB_PATH,
  PLANNING_REVIEWS_COMPACT_LINE,
  PLANNING_REVIEWS_HEADING,
  PLANNING_REVIEWS_PLANNING_LINK,
  PLANNING_REVIEWS_REVIEWS_LINK,
  PLANNING_REVIEWS_WHY_TWO,
  buildPlanningReviewsVocabulary,
  resolvePlanningReviewsPeerLink,
} from "@/lib/vocabulary/planning-reviews-vocabulary";
import { PLANNING_PATH } from "@/lib/planning-route";

describe("planning-reviews-vocabulary (TB-2238)", () => {
  it("explains why planning and reviews stay separate and deep-links both", () => {
    const model = buildPlanningReviewsVocabulary();

    expect(model.heading).toBe(PLANNING_REVIEWS_HEADING);
    expect(model.whyTwo).toBe(PLANNING_REVIEWS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("planning");
    expect(model.whyTwo.toLowerCase()).toContain("architecture package");
    expect(model.compactLine).toBe(PLANNING_REVIEWS_COMPACT_LINE);

    expect(model.planningLink).toEqual(PLANNING_REVIEWS_PLANNING_LINK);
    expect(model.planningLink.href).toBe(PLANNING_PATH);
    expect(model.planningLink.href).toBe("/insights/improvement-planning");

    expect(model.reviewsLink).toEqual(PLANNING_REVIEWS_REVIEWS_LINK);
    expect(model.reviewsLink.href).toBe(ARCHITECTURE_REVIEWS_HUB_PATH);
    expect(model.reviewsLink.href).toBe("/architecture/reviews");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolvePlanningReviewsPeerLink("improvement-planning")).toEqual(
      PLANNING_REVIEWS_REVIEWS_LINK,
    );
    expect(resolvePlanningReviewsPeerLink("architecture-reviews")).toEqual(
      PLANNING_REVIEWS_PLANNING_LINK,
    );
  });
});
