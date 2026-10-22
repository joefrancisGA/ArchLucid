import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BANNED_PRIMARY_FIRST_REVIEW_GUIDE_LABEL_PATTERNS,
  PRODUCT_FIRST_REVIEW_HELP_CTA_SOURCE_FILES,
  sourceContainsBannedPrimaryFirstReviewGuideLabel,
  sourceContainsRetiredFirstReviewHelpCta,
  sourceDeclaresCanonicalFirstReviewHelpCta,
} from "@/lib/first-architecture-review-help-cta-guard-surfaces";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";

function readCtaGuardSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("first-architecture-review help CTA regression guard (TB-1378)", () => {
  it("keeps listed product CTA surfaces on canonical first-architecture-review handoffs", () => {
    for (const relativePath of PRODUCT_FIRST_REVIEW_HELP_CTA_SOURCE_FILES) {
      const source = readCtaGuardSource(relativePath);

      expect(sourceContainsRetiredFirstReviewHelpCta(source), relativePath).toBe(false);
      expect(sourceContainsBannedPrimaryFirstReviewGuideLabel(source), relativePath).toBe(false);
      expect(sourceDeclaresCanonicalFirstReviewHelpCta(source), relativePath).toBe(true);
    }
  });

  it("does not redirect legacy first-review slugs", () => {
    expect(resolveHelpTopicPermanentRedirect("first-hour-operator-path")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("core-pilot")).toBeNull();
    expect(inAppHelpHref("first-architecture-review")).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
  });

  it("documents banned primary first-review guide label patterns for CI reviewers", () => {
    expect(BANNED_PRIMARY_FIRST_REVIEW_GUIDE_LABEL_PATTERNS.length).toBeGreaterThan(0);
  });
});
