/** Canonical in-page anchors for `/help/review-packages` (TB-1401). */
export const REVIEW_PACKAGES_HELP_CANONICAL_ANCHORS = [
  "what-an-architecture-package-contains",
  "where-to-find-your-packages",
  "inspect-an-architecture-package",
  "export-an-architecture-package",
] as const;

/** Bookmarked legacy review-package anchors redirect to architecture-package ids. */
export const REVIEW_PACKAGES_HELP_LEGACY_ANCHOR_ALIASES: Readonly<Record<string, string>> = {
  "what-a-review-package-contains": "what-an-architecture-package-contains",
  "inspect-a-review-package": "inspect-an-architecture-package",
  "export-a-review-package": "export-an-architecture-package",
};

export const REVIEW_PACKAGES_HELP_ANCHOR_HONESTY_SOURCE_FILES: readonly string[] = [
  "docs/library/customer-facing/REVIEW_PACKAGES_OPERATOR_GUIDE.md",
  "src/lib/review-packages-help-guide-content.ts",
] as const;

export const BANNED_REVIEW_PACKAGES_HELP_ANCHOR_PATTERNS: readonly RegExp[] = [
  /\{#what-a-review-package/,
  /\{#inspect-a-review-package/,
  /\{#export-a-review-package/,
  /#what-a-review-package/,
  /#inspect-a-review-package/,
  /#export-a-review-package/,
] as const;

export function sourceContainsBannedReviewPackagesHelpAnchors(source: string): boolean {
  return BANNED_REVIEW_PACKAGES_HELP_ANCHOR_PATTERNS.some((pattern) => pattern.test(source));
}
