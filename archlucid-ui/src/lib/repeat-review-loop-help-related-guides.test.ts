import { describe, expect, it } from "vitest";

import {
  REPEAT_REVIEW_LOOP_HELP_BANNED_RELATED_HELP_SLUGS,
  REPEAT_REVIEW_LOOP_HELP_RELATED_GUIDES,
  repeatReviewLoopHelpRelatedGuides,
} from "@/lib/repeat-review-loop-help-related-guides";

describe("repeat-review-loop help related guides (TB-1397)", () => {
  it("keeps at most three buyer-safe related guides without accelerator chooser leakage", () => {
    const guides = repeatReviewLoopHelpRelatedGuides();

    expect(guides).toEqual([...REPEAT_REVIEW_LOOP_HELP_RELATED_GUIDES]);
    expect(guides.length).toBeLessThanOrEqual(3);

    for (const bannedSlug of REPEAT_REVIEW_LOOP_HELP_BANNED_RELATED_HELP_SLUGS) {
      expect(guides.some((guide) => guide.href.includes(bannedSlug))).toBe(false);
    }
  });

  it("prefers review-packages, first-architecture-review, and governance-approval for the second-review job", () => {
    const hrefs = repeatReviewLoopHelpRelatedGuides().map((guide) => guide.href);

    expect(hrefs).toContain("/help/review-packages");
    expect(hrefs).toContain("/help/first-architecture-review");
    expect(hrefs).toContain("/help/governance-approval");
    expect(hrefs).not.toContain("/help/comparison-replay");
  });
});
