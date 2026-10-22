import { describe, expect, it } from "vitest";

import {
  REVIEW_PACKAGES_HELP_BANNED_RELATED_HELP_SLUGS,
  REVIEW_PACKAGES_HELP_RELATED_GUIDES,
  reviewPackagesHelpRelatedGuides,
} from "@/lib/review-packages-help-related-guides";

describe("review-packages help related guides (TB-1402)", () => {
  it("keeps at most three buyer-safe related guides without review-hub leakage", () => {
    const guides = reviewPackagesHelpRelatedGuides();

    expect(guides).toEqual([...REVIEW_PACKAGES_HELP_RELATED_GUIDES]);
    expect(guides.length).toBeLessThanOrEqual(3);

    for (const bannedSlug of REVIEW_PACKAGES_HELP_BANNED_RELATED_HELP_SLUGS) {
      expect(guides.some((guide) => guide.href.includes(bannedSlug))).toBe(false);
    }
  });

  it("prefers evidence-intake, findings, and evidence-trail for package browse and inspect", () => {
    const hrefs = reviewPackagesHelpRelatedGuides().map((guide) => guide.href);

    expect(hrefs).toContain("/help/evidence-intake");
    expect(hrefs).toContain("/help/findings");
    expect(hrefs).toContain("/help/evidence-trail");
  });
});
