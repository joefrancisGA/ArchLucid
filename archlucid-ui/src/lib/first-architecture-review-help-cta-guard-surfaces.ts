import { FIRST_ARCHITECTURE_REVIEW_DISCOVERY_SOURCE_FILES } from "@/lib/first-architecture-review-help-discovery-surfaces";
import {
  FIRST_ARCHITECTURE_REVIEW_INBOUND_HANDOFF_SOURCE_FILES,
  RETIRED_FIRST_REVIEW_HELP_HANDOFF_MARKERS,
} from "@/lib/first-architecture-review-help-inbound-handoff-surfaces";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";

/**
 * TB-1378 — product surfaces that can render a first-review help CTA must stay on
 * `/help/first-architecture-review` and must not resurrect first-hour/core-pilot twins.
 */
export const PRODUCT_FIRST_REVIEW_HELP_CTA_SOURCE_FILES: readonly string[] = [
  ...FIRST_ARCHITECTURE_REVIEW_INBOUND_HANDOFF_SOURCE_FILES,
  ...FIRST_ARCHITECTURE_REVIEW_DISCOVERY_SOURCE_FILES,
  "src/components/HelpPanel.tsx",
  "src/components/CorePilotNextStepsCard.tsx",
] as const;

export const RETIRED_FIRST_REVIEW_HELP_CTA_MARKERS: readonly string[] =
  RETIRED_FIRST_REVIEW_HELP_HANDOFF_MARKERS;

/** Buyer chrome must not label retired twins as the primary first-review guide. */
export const BANNED_PRIMARY_FIRST_REVIEW_GUIDE_LABEL_PATTERNS: readonly RegExp[] = [
  /label="Open Core Pilot guide"/,
  /label="Core Pilot guide"/,
  />Open Core Pilot guide</,
  /title:\s*"First-hour review path"/,
  /helpSlug="first-hour-operator-path"/,
  /helpSlug="core-pilot"/,
  /href="\/help\/first-hour-operator-path"/,
  /href="\/help\/core-pilot"/,
] as const;

export const CANONICAL_FIRST_REVIEW_HELP_CTA_MARKERS: readonly string[] = [
  FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  "first-architecture-review",
  "FIRST_ARCHITECTURE_REVIEW_HELP_PATH",
  "FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE",
] as const;

export function sourceContainsRetiredFirstReviewHelpCta(source: string): boolean {
  return RETIRED_FIRST_REVIEW_HELP_CTA_MARKERS.some((marker) => source.includes(marker));
}

export function sourceContainsBannedPrimaryFirstReviewGuideLabel(source: string): boolean {
  return BANNED_PRIMARY_FIRST_REVIEW_GUIDE_LABEL_PATTERNS.some((pattern) => pattern.test(source));
}

export function sourceDeclaresCanonicalFirstReviewHelpCta(source: string): boolean {
  return CANONICAL_FIRST_REVIEW_HELP_CTA_MARKERS.some((marker) => source.includes(marker));
}
