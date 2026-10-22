import { describe, expect, it } from "vitest";

import {
  COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS,
  comparisonReplayValidateReviewUnavailableCopy,
  isComparisonReplayValidateReviewActionAvailable,
} from "@/lib/comparison-replay-help-guide-content";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

describe("comparison-replay-help-guide-content", () => {
  it("uses canonical replayReview nav label for Validate review actions", () => {
    expect(OPERATOR_NAV_LINK_LABELS.replayReview).toBe("Validate review");
    expect(COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.validateReview.label).toBe("Open Validate review");
    expect(COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.compareTwoReviews.label).toBe("Open Compare two reviews");
  });

  it("exports validate availability helpers for demo gating", () => {
    expect(typeof isComparisonReplayValidateReviewActionAvailable()).toBe("boolean");
    expect(
      comparisonReplayValidateReviewUnavailableCopy() === null ||
        comparisonReplayValidateReviewUnavailableCopy()?.label === "Validate review",
    ).toBe(true);
  });
});
