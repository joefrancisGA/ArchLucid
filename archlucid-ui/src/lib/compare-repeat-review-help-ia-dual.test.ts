import { describe, expect, it } from "vitest";

import {
  COMPARISON_REPLAY_HELP_IA_DUAL_INBOUND_LABEL,
  COMPARISON_REPLAY_HELP_JOB_MATRIX,
  REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX,
} from "@/lib/compare-repeat-review-help-ia-dual";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";

describe("compare-repeat-review help IA dual (TB-1638)", () => {
  it("declares distinct mutual cross-link labels for each specialty guide", () => {
    const comparisonReplaySibling = COMPARISON_REPLAY_HELP_JOB_MATRIX.find((row) => row.isCurrent !== true);
    const repeatReviewSibling = REPEAT_REVIEW_LOOP_HELP_JOB_MATRIX.find((row) => row.isCurrent !== true);

    expect(comparisonReplaySibling?.label).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE);
    expect(comparisonReplaySibling?.href).toBe("/help/repeat-review-loop");
    expect(repeatReviewSibling?.label).toBe(COMPARISON_REPLAY_HELP_IA_DUAL_INBOUND_LABEL);
    expect(repeatReviewSibling?.href).toBe("/help/comparison-replay");
    expect(repeatReviewSibling?.label).not.toBe(comparisonReplaySibling?.label);
  });
});
