import { describe, expect, it } from "vitest";

import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  REVIEW_SCORECARD_EMPTY_PRIMARY_CTA,
  REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
  REVIEW_SCORECARD_SAMPLE_HREF,
  buildReviewScorecardSampleHref,
  isReviewScorecardSampleMode,
} from "@/lib/review-scorecard-empty-state";

describe("review-scorecard-empty-state", () => {
  it("detects sample mode from the sample query param", () => {
    expect(isReviewScorecardSampleMode(new URLSearchParams("sample=1"))).toBe(true);
    expect(isReviewScorecardSampleMode(new URLSearchParams())).toBe(false);
    expect(isReviewScorecardSampleMode(null)).toBe(false);
  });

  it("exposes stable CTA labels and sample href", () => {
    expect(REVIEW_SCORECARD_EMPTY_PRIMARY_CTA).toBe(BUYER_START_ARCHITECTURE_REVIEW_CTA);
    expect(REVIEW_SCORECARD_EMPTY_TERTIARY_CTA).toBe("View sample scorecard");
    expect(buildReviewScorecardSampleHref()).toBe(REVIEW_SCORECARD_SAMPLE_HREF);
  });
});
