import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getHelpCenterDisplay, getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  BANNED_REPEAT_REVIEW_HELP_CUSTOMER_TITLE_PATTERNS,
  REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL,
  REPEAT_REVIEW_LOOP_HELP_TITLE_HONESTY_SOURCE_FILES,
  sourceContainsBannedRepeatReviewHelpCustomerTitle,
  sourceDeclaresCanonicalRepeatReviewHelpTitle,
} from "@/lib/repeat-review-loop-help-title-honesty-surfaces";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";

function readTitleHonestySource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("repeat-review-loop help title/tier honesty (TB-1395)", () => {
  it("classifies repeat-review-loop as product tier with canonical buyer title", () => {
    const entry = getProductDocumentationEntry("repeat-review-loop");

    expect(entry).not.toBeNull();
    expect(entry?.title).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE);
    expect(getHelpCenterTier(entry!)).toBe("product");
    expect(getHelpCenterDisplay(entry!).title).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE);
  });

  it("keeps listed inbound surfaces on canonical repeat-review help title without stickiness jargon", () => {
    for (const relativePath of REPEAT_REVIEW_LOOP_HELP_TITLE_HONESTY_SOURCE_FILES) {
      const source = readTitleHonestySource(relativePath);

      expect(sourceContainsBannedRepeatReviewHelpCustomerTitle(source), relativePath).toBe(false);
      expect(sourceDeclaresCanonicalRepeatReviewHelpTitle(source), relativePath).toBe(true);
    }
  });

  it("documents banned repeat-review customer title patterns for reviewers", () => {
    expect(BANNED_REPEAT_REVIEW_HELP_CUSTOMER_TITLE_PATTERNS.length).toBeGreaterThan(0);
    expect(REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL).toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE);
  });
});
