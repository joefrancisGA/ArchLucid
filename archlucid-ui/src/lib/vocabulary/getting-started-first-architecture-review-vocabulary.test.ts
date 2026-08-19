import { describe, expect, it } from "vitest";

import {
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE,
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK,
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK,
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_HEADING,
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_WHY_TWO,
  buildGettingStartedFirstArchitectureReviewVocabulary,
  resolveGettingStartedFirstArchitectureReviewPeerLink,
} from "@/lib/vocabulary/getting-started-first-architecture-review-vocabulary";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { GETTING_STARTED_HELP_PATH } from "@/lib/getting-started-help-guide-content";

describe("getting-started-first-architecture-review-vocabulary (TB-2312)", () => {
  it("explains product orientation vs guided first-review path", () => {
    const model = buildGettingStartedFirstArchitectureReviewVocabulary();

    expect(model.heading).toBe(GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_HEADING);
    expect(model.whyTwo).toBe(GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("orient");
    expect(model.whyTwo.toLowerCase()).toContain("guided");
    expect(model.compactLine).toBe(GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE);

    expect(model.gettingStartedLink).toEqual(
      GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK,
    );
    expect(model.gettingStartedLink.href).toBe(GETTING_STARTED_HELP_PATH);
    expect(model.firstArchitectureReviewLink).toEqual(
      GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK,
    );
    expect(model.firstArchitectureReviewLink.href).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
  });

  it("resolves the peer surface from getting-started and first-architecture-review", () => {
    expect(resolveGettingStartedFirstArchitectureReviewPeerLink("getting-started")).toEqual(
      GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK,
    );

    expect(
      resolveGettingStartedFirstArchitectureReviewPeerLink("first-architecture-review"),
    ).toEqual(GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK);
  });
});
