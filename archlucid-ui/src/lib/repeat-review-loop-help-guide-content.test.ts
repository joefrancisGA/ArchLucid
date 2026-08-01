import { describe, expect, it } from "vitest";

import {
  REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE,
  REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER,
  repeatReviewLoopHelpPageSubtitle,
} from "@/lib/repeat-review-loop-help-guide-content";

describe("repeat-review-loop-help-guide-content", () => {
  it("uses shorter buyer subtitle", () => {
    expect(repeatReviewLoopHelpPageSubtitle(true)).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER);
    expect(repeatReviewLoopHelpPageSubtitle(false)).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE);
    expect(REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER.length).toBeLessThan(
      REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE.length,
    );
  });
});
