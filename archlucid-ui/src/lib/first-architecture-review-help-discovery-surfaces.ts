import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";

/** TB-1377 — canonical first-review help slug for search / featured / catalog discovery. */
export const CANONICAL_FIRST_REVIEW_HELP_DISCOVERY_SLUG = "first-architecture-review" as const;

export const RETIRED_FIRST_REVIEW_HELP_DISCOVERY_SLUGS: readonly string[] = [
  "core-pilot",
  "first-hour-operator-path",
  "first-pilot-path",
  "evidence-only-review",
] as const;

export const FIRST_ARCHITECTURE_REVIEW_DISCOVERY_SOURCE_FILES: readonly string[] = [
  "src/lib/help/help-center-catalog.ts",
  "src/lib/help/help-search-panel-catalog.ts",
] as const;

export function isRetiredFirstReviewHelpDiscoverySlug(slug: string): boolean {
  return RETIRED_FIRST_REVIEW_HELP_DISCOVERY_SLUGS.includes(slug);
}

export function hrefIsCanonicalFirstArchitectureReviewHelpDiscovery(href: string): boolean {
  return href === FIRST_ARCHITECTURE_REVIEW_HELP_PATH || href.startsWith(`${FIRST_ARCHITECTURE_REVIEW_HELP_PATH}#`);
}
