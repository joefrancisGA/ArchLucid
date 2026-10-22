import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";

/**
 * TB-1395 — repeat-review help is product-tier buyer orientation; inbound chrome must use the
 * canonical page title and must not resurrect stickiness engineering vocabulary.
 */
export const REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL = REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE;

export const REPEAT_REVIEW_LOOP_HELP_TITLE_HONESTY_SOURCE_FILES: readonly string[] = [
  "src/lib/help/help-center-catalog.ts",
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/repeat-review-activation.ts",
  "src/lib/compare-repeat-review-help-ia-dual.ts",
  "src/components/RepeatReviewActivationPrompt.tsx",
  "src/lib/contextual-help/pattern-library-rows.ts",
] as const;

export const BANNED_REPEAT_REVIEW_HELP_CUSTOMER_TITLE_PATTERNS: readonly RegExp[] = [
  /Repeat-review stickiness/i,
  /repeat-review stickiness/i,
  /stickiness loop/i,
  /label:\s*"Repeat-review loop"/,
  /label="Repeat-review loop"/,
  /"Repeat-review loop"/,
  /Repeat-review loop -/,
] as const;

export const CANONICAL_REPEAT_REVIEW_HELP_TITLE_MARKERS: readonly string[] = [
  REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
  "REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE",
  "REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL",
] as const;

export function sourceContainsBannedRepeatReviewHelpCustomerTitle(source: string): boolean {
  return BANNED_REPEAT_REVIEW_HELP_CUSTOMER_TITLE_PATTERNS.some((pattern) => pattern.test(source));
}

export function sourceDeclaresCanonicalRepeatReviewHelpTitle(source: string): boolean {
  return CANONICAL_REPEAT_REVIEW_HELP_TITLE_MARKERS.some((marker) => source.includes(marker));
}
