import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getHelpCenterDisplay, getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { REVIEW_PACKAGES_HELP_PAGE_TITLE } from "@/lib/review-packages-help-page-copy";
import {
  BANNED_REVIEW_PACKAGES_HELP_CUSTOMER_TITLE_PATTERNS,
  REVIEW_PACKAGES_HELP_INBOUND_LABEL,
  REVIEW_PACKAGES_HELP_TITLE_HONESTY_SOURCE_FILES,
  sourceContainsBannedReviewPackagesHelpCustomerTitle,
  sourceDeclaresCanonicalReviewPackagesHelpTitle,
} from "@/lib/review-packages-help-title-honesty-surfaces";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readTitleHonestySource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("review-packages help title hierarchy honesty (TB-1400)", () => {
  it("aligns registry, help center, H1 constant, and reviews hub page-help label", () => {
    const entry = getProductDocumentationEntry("review-packages");

    expect(entry).not.toBeNull();
    expect(entry?.title).toBe(REVIEW_PACKAGES_HELP_PAGE_TITLE);
    expect(REVIEW_PACKAGES_HELP_PAGE_TITLE).toBe("Architecture packages");
    expect(getHelpCenterTier(entry!)).toBe("product");
    expect(getHelpCenterDisplay(entry!).title).toBe(REVIEW_PACKAGES_HELP_PAGE_TITLE);

    const reviewsHubHelp = pageHelpTopicForPathname("/architecture/reviews");

    expect(reviewsHubHelp?.slug).toBe("review-packages");
    expect(reviewsHubHelp?.label).toBe(REVIEW_PACKAGES_HELP_PAGE_TITLE);
  });

  it("keeps listed inbound surfaces on canonical review-packages title without bare Reviews labels", () => {
    for (const relativePath of REVIEW_PACKAGES_HELP_TITLE_HONESTY_SOURCE_FILES) {
      const source = readTitleHonestySource(relativePath);

      expect(sourceContainsBannedReviewPackagesHelpCustomerTitle(source), relativePath).toBe(false);
      expect(sourceDeclaresCanonicalReviewPackagesHelpTitle(source), relativePath).toBe(true);
    }
  });

  it("documents banned review-packages customer title patterns for reviewers", () => {
    expect(BANNED_REVIEW_PACKAGES_HELP_CUSTOMER_TITLE_PATTERNS.length).toBeGreaterThan(0);
    expect(REVIEW_PACKAGES_HELP_INBOUND_LABEL).toBe(REVIEW_PACKAGES_HELP_PAGE_TITLE);
  });
});
