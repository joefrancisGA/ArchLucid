import { describe, expect, it } from "vitest";

import {
  CRITIC_HAS_NOT_RUN_YET_LABEL,
  CRITIC_INCLUDED_LABEL,
  CRITIC_OUTPUT_NOT_STORED_LABEL,
  formatReviewDefensibilityCriticLabel,
} from "@/lib/reviews/review-defensibility-critic-display";

describe("review-defensibility-critic-display (P-01)", () => {
  it("labels pipeline in flight separately from stored critic output", () => {
    expect(formatReviewDefensibilityCriticLabel(true, true)).toBe(CRITIC_HAS_NOT_RUN_YET_LABEL);
    expect(formatReviewDefensibilityCriticLabel(false, true)).toBe(CRITIC_OUTPUT_NOT_STORED_LABEL);
    expect(formatReviewDefensibilityCriticLabel(false, false)).toBe(CRITIC_INCLUDED_LABEL);
  });
});
