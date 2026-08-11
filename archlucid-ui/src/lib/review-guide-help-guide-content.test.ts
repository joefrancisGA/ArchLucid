import { describe, expect, it } from "vitest";

import { RUNS_EMPTY } from "@/lib/empty-state-presets";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  prepareReviewGuideHelpBodyMarkdown,
  REVIEW_GUIDE_HELP_MORE_RELATED_GUIDES,
  REVIEW_GUIDE_HELP_PRIMARY_ACTIONS,
  REVIEW_GUIDE_HELP_RELATED_GUIDES,
  stripReviewGuideRelatedGuidesFromMarkdown,
} from "@/lib/review-guide-help-guide-content";

describe("review-guide-help-guide-content (TB-1259–TB-1262)", () => {
  it("points the primary wizard CTA at /reviews/new (TB-1259)", () => {
    expect(REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href).toBe("/architecture/reviews/new");
    expect(REVIEW_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label).toBe("Start architecture review");
  });

  it("curates two primary related guides with optional more links (TB-1262)", () => {
    expect(REVIEW_GUIDE_HELP_RELATED_GUIDES).toHaveLength(2);
    expect(REVIEW_GUIDE_HELP_RELATED_GUIDES.map((link) => link.href)).toEqual([
      inAppHelpHref("evidence-intake"),
      inAppHelpHref("review-packages"),
    ]);
    expect(REVIEW_GUIDE_HELP_MORE_RELATED_GUIDES.length).toBeGreaterThan(0);
    expect(
      [...REVIEW_GUIDE_HELP_RELATED_GUIDES, ...REVIEW_GUIDE_HELP_MORE_RELATED_GUIDES].every((link) =>
        link.href.includes("/help/"),
      ),
    ).toBe(true);
    expect(
      [...REVIEW_GUIDE_HELP_RELATED_GUIDES, ...REVIEW_GUIDE_HELP_MORE_RELATED_GUIDES].some((link) =>
        link.href.includes("first-hour"),
      ),
    ).toBe(false);
    expect(
      [...REVIEW_GUIDE_HELP_RELATED_GUIDES, ...REVIEW_GUIDE_HELP_MORE_RELATED_GUIDES].some((link) =>
        link.href.includes("first-architecture-review"),
      ),
    ).toBe(false);
  });

  it("strips the markdown Related guides section for specialty chrome (TB-1262)", () => {
    const markdown = "# Review guide\n\n## Related guides\n\n- [Evidence intake](/help/evidence-intake)\n";

    expect(stripReviewGuideRelatedGuidesFromMarkdown(markdown)).not.toContain("## Related guides");
    expect(prepareReviewGuideHelpBodyMarkdown(markdown)).not.toContain("## Related guides");
  });

  it("unifies discovery on review-guide (TB-1261)", () => {
    expect(getProductDocumentationEntry("review-guide")?.title).toBe("Review guide");
    expect(getProductDocumentationEntry("starting-reviews")).toBeNull();
    expect(getProductDocumentationEntry("creating-runs")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("starting-reviews")).toBe("/help/review-guide");
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBe("/help/review-guide");
    expect(inAppHelpHref("starting-reviews")).toBe("/help/review-guide");
    expect(RUNS_EMPTY.helpTopicPath).toBe("review-guide");
  });
});
