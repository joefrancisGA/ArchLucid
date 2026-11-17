import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  BANNED_REVIEW_PACKAGES_HELP_EXPORT_PATTERNS,
  REVIEW_PACKAGES_HELP_EMPTY_WORKSPACE_EXPORT_COPY,
  REVIEW_PACKAGES_HELP_EXPORT_ACTIONS,
  REVIEW_PACKAGES_HELP_EXPORT_BUYER_CLAIM,
  REVIEW_PACKAGES_HELP_EXPORT_HONESTY_SOURCE_FILES,
  sourceContainsBannedReviewPackagesHelpExportCopy,
} from "@/lib/review-packages-help-export-copy";
import { prepareReviewPackagesHelpBodyMarkdown } from "@/lib/review-packages-help-guide-content";

function readExportHonestySource(relativePath: string): string {
  const base = relativePath.startsWith("docs/")
    ? join(process.cwd(), "..")
    : process.cwd();

  return readFileSync(join(base, relativePath), "utf8");
}

describe("review-packages help export honesty (TB-1403)", () => {
  const loaded = tryLoadProductDocumentation("review-packages");

  it("exposes sample and start-review next steps with explicit empty-workspace copy", () => {
    expect(REVIEW_PACKAGES_HELP_EXPORT_ACTIONS.openSample.label.length).toBeGreaterThan(0);
    expect(REVIEW_PACKAGES_HELP_EXPORT_ACTIONS.startReview.label.length).toBeGreaterThan(0);
    expect(REVIEW_PACKAGES_HELP_EXPORT_ACTIONS.openSample.href).toContain("/architecture/reviews/");
    expect(REVIEW_PACKAGES_HELP_EXPORT_ACTIONS.startReview.href).toBe("/architecture/reviews/new");
    expect(REVIEW_PACKAGES_HELP_EMPTY_WORKSPACE_EXPORT_COPY).toMatch(/no packages yet/i);
    expect(REVIEW_PACKAGES_HELP_EXPORT_BUYER_CLAIM).toMatch(/finalized review record/i);
    expect(REVIEW_PACKAGES_HELP_EXPORT_BUYER_CLAIM).not.toMatch(/signed manifest/i);
  });

  it("forbids bare Signed manifest export jargon in source and prepared body", () => {
    if (loaded === null) {
      throw new Error("Expected review-packages guide to load.");
    }

    for (const relativePath of REVIEW_PACKAGES_HELP_EXPORT_HONESTY_SOURCE_FILES) {
      const source = readExportHonestySource(relativePath);

      expect(sourceContainsBannedReviewPackagesHelpExportCopy(source), relativePath).toBe(false);
    }

    const body = prepareReviewPackagesHelpBodyMarkdown(loaded.markdown);

    expect(sourceContainsBannedReviewPackagesHelpExportCopy(body)).toBe(false);
    expect(body).toMatch(/sealed review record/i);
    expect(BANNED_REVIEW_PACKAGES_HELP_EXPORT_PATTERNS.length).toBeGreaterThan(0);
  });
});
