import { describe, expect, it } from "vitest";

import {
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE,
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK,
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HEADING,
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK,
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_WHY_TWO,
  buildFirstReviewGuideFirstArchitectureReviewVocabulary,
  resolveFirstReviewGuideFirstArchitectureReviewPeerLink,
} from "@/lib/vocabulary/first-review-guide-first-architecture-review-vocabulary";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";

describe("first-review-guide-first-architecture-review-vocabulary (TB-2323)", () => {
  it("explains in-product checklist hub vs help guided path", () => {
    const model = buildFirstReviewGuideFirstArchitectureReviewVocabulary();

    expect(model.heading).toBe(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HEADING);
    expect(model.whyTwo).toBe(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("checklist");
    expect(model.whyTwo.toLowerCase()).toContain("help");
    expect(model.compactLine).toBe(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE);

    expect(model.firstReviewGuideLink).toEqual(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK);
    expect(model.firstReviewGuideLink.href).toBe(FIRST_REVIEW_GUIDE_PATH);

    expect(model.firstArchitectureReviewLink).toEqual(
      FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK,
    );
    expect(model.firstArchitectureReviewLink.href).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
  });

  it("resolves the peer surface from first-review-guide and first-architecture-review", () => {
    expect(resolveFirstReviewGuideFirstArchitectureReviewPeerLink("first-review-guide")).toEqual(
      FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK,
    );

    expect(
      resolveFirstReviewGuideFirstArchitectureReviewPeerLink("first-architecture-review"),
    ).toEqual(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK);
  });
});
