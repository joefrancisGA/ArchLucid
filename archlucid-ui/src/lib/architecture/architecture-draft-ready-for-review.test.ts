import { describe, expect, it } from "vitest";

import {
  countArchitectureDraftsReadyForReview,
  isArchitectureDraftEligibleToStartReview,
} from "@/lib/architecture/architecture-draft-ready-for-review";

describe("architecture-draft-ready-for-review", () => {
  it("treats non-archived drafts without a linked review as eligible", () => {
    expect(
      isArchitectureDraftEligibleToStartReview({
        linkedReviewId: null,
        customerStatus: "draft",
      }),
    ).toBe(true);
    expect(
      isArchitectureDraftEligibleToStartReview({
        linkedReviewId: null,
        customerStatus: "ready-for-review",
      }),
    ).toBe(true);
  });

  it("excludes archived drafts and drafts already linked to a review", () => {
    expect(
      isArchitectureDraftEligibleToStartReview({
        linkedReviewId: null,
        customerStatus: "archived",
      }),
    ).toBe(false);
    expect(
      isArchitectureDraftEligibleToStartReview({
        linkedReviewId: "review-1",
        customerStatus: "ready-for-review",
      }),
    ).toBe(false);
  });

  it("counts only eligible drafts", () => {
    expect(
      countArchitectureDraftsReadyForReview([
        { linkedReviewId: null, customerStatus: "draft" },
        { linkedReviewId: null, customerStatus: "ready-for-review" },
        { linkedReviewId: "r1", customerStatus: "draft" },
        { linkedReviewId: null, customerStatus: "archived" },
      ]),
    ).toBe(2);
  });
});
