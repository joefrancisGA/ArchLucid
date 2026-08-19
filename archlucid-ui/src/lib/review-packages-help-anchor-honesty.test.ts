import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  helpTopicSlugFromPathname,
  resolveHelpTopicHashFragment,
} from "@/lib/help/help-topic-hash-aliases";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  BANNED_REVIEW_PACKAGES_HELP_ANCHOR_PATTERNS,
  REVIEW_PACKAGES_HELP_ANCHOR_HONESTY_SOURCE_FILES,
  REVIEW_PACKAGES_HELP_CANONICAL_ANCHORS,
  REVIEW_PACKAGES_HELP_LEGACY_ANCHOR_ALIASES,
  sourceContainsBannedReviewPackagesHelpAnchors,
} from "@/lib/review-packages-help-anchor-honesty-surfaces";
import { prepareReviewPackagesHelpBodyMarkdown } from "@/lib/review-packages-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

function readAnchorHonestySource(relativePath: string): string {
  const base = relativePath.startsWith("docs/")
    ? join(process.cwd(), "..")
    : process.cwd();

  return readFileSync(join(base, relativePath), "utf8");
}

describe("review-packages help anchor honesty (TB-1401)", () => {
  const loaded = tryLoadProductDocumentation("review-packages");
  const entry = getProductDocumentationEntry("review-packages");

  it("maps legacy review-package hash fragments to architecture-package anchors", () => {
    expect(helpTopicSlugFromPathname("/help/review-packages")).toBe("review-packages");
    expect(resolveHelpTopicHashFragment("review-packages", "what-a-review-package-contains")).toBe(
      "what-an-architecture-package-contains",
    );
    expect(resolveHelpTopicHashFragment("review-packages", "inspect-a-review-package")).toBe(
      "inspect-an-architecture-package",
    );
    expect(resolveHelpTopicHashFragment("review-packages", "export-a-review-package")).toBe(
      "export-an-architecture-package",
    );
    expect(resolveHelpTopicHashFragment("review-packages", "what-an-architecture-package-contains")).toBe(
      "what-an-architecture-package-contains",
    );
    expect(resolveHelpTopicHashFragment("getting-started", "what-a-review-package-contains")).toBe(
      "what-a-review-package-contains",
    );
  });

  it("documents legacy alias coverage for bookmarked review-package anchors", () => {
    expect(Object.keys(REVIEW_PACKAGES_HELP_LEGACY_ANCHOR_ALIASES)).toHaveLength(3);

    for (const canonicalAnchor of REVIEW_PACKAGES_HELP_CANONICAL_ANCHORS) {
      expect(canonicalAnchor).toMatch(/architecture-package|your-packages/);
      expect(canonicalAnchor).not.toMatch(/review-package/);
    }
  });

  it("keeps source and prepared TOC anchors on architecture-package ids", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review-packages guide to load.");
    }

    for (const relativePath of REVIEW_PACKAGES_HELP_ANCHOR_HONESTY_SOURCE_FILES) {
      const source = readAnchorHonestySource(relativePath);

      expect(sourceContainsBannedReviewPackagesHelpAnchors(source), relativePath).toBe(false);
    }

    const body = prepareReviewPackagesHelpBodyMarkdown(loaded.markdown);
    const prepared = prepareHelpMarkdownForPresentation(body, entry.sourcePaths[0] ?? "", {
      helpTopicSlug: entry.slug,
    });
    const headings = extractHelpMarkdownHeadings(prepared);
    const headingIds = headings.map((heading) => heading.id);

    for (const canonicalAnchor of REVIEW_PACKAGES_HELP_CANONICAL_ANCHORS) {
      expect(headingIds, canonicalAnchor).toContain(canonicalAnchor);
    }

    expect(headingIds.some((id) => id.includes("review-package"))).toBe(false);
    expect(BANNED_REVIEW_PACKAGES_HELP_ANCHOR_PATTERNS.length).toBeGreaterThan(0);
  });
});
