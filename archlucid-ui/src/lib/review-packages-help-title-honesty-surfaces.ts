import { REVIEW_PACKAGES_HELP_PAGE_TITLE } from "@/lib/review-packages-help-page-copy";

/**
 * TB-1400 — review-packages help uses Architecture packages as the customer title; inbound
 * page-help chrome must match registry/H1 and must not resurrect bare "Reviews" labels.
 */
export const REVIEW_PACKAGES_HELP_INBOUND_LABEL = REVIEW_PACKAGES_HELP_PAGE_TITLE;

export const REVIEW_PACKAGES_HELP_TITLE_HONESTY_SOURCE_FILES: readonly string[] = [
  "src/lib/review-packages-help-page-copy.ts",
  "src/lib/review-packages-help-guide-content.ts",
  "src/lib/product-documentation-registry.ts",
  "src/lib/usability/page-help-topic-map.ts",
  "src/app/(operator)/help/_sections/HelpReviewPackagesGuideView.tsx",
] as const;

export const BANNED_REVIEW_PACKAGES_HELP_CUSTOMER_TITLE_PATTERNS: readonly RegExp[] = [
  /REVIEW_PACKAGES_HELP_PAGE_TITLE\s*=\s*"Architecture reviews"/,
  /label:\s*"Reviews"/,
  /title:\s*"Reviews"/,
] as const;

export const CANONICAL_REVIEW_PACKAGES_HELP_TITLE_MARKERS: readonly string[] = [
  REVIEW_PACKAGES_HELP_PAGE_TITLE,
  "REVIEW_PACKAGES_HELP_PAGE_TITLE",
  "REVIEW_PACKAGES_HELP_INBOUND_LABEL",
] as const;

export function sourceContainsBannedReviewPackagesHelpCustomerTitle(source: string): boolean {
  return BANNED_REVIEW_PACKAGES_HELP_CUSTOMER_TITLE_PATTERNS.some((pattern) => pattern.test(source));
}

export function sourceDeclaresCanonicalReviewPackagesHelpTitle(source: string): boolean {
  return CANONICAL_REVIEW_PACKAGES_HELP_TITLE_MARKERS.some((marker) => source.includes(marker));
}
