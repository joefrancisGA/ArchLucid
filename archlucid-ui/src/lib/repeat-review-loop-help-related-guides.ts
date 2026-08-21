import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { resolveRelatedFollowUpsTitle } from "@/lib/help/related-follow-ups-title";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** TB-1397: at most three related guides that support the second-review job without eng chooser leakage. */
export const REPEAT_REVIEW_LOOP_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: "Architecture packages", href: inAppHelpHref("review-packages") },
  { label: FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE, href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH },
  { label: "Resolve outcomes", href: inAppHelpHref("governance-approval") },
] as const;

export const REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING = resolveRelatedFollowUpsTitle(
  REPEAT_REVIEW_LOOP_HELP_RELATED_GUIDES,
);

export const REPEAT_REVIEW_LOOP_HELP_BANNED_RELATED_HELP_SLUGS: readonly string[] = [
  "accelerator-chooser",
  "core-pilot",
] as const;

/** Related guides for `/help/repeat-review-loop`. */
export function repeatReviewLoopHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return REPEAT_REVIEW_LOOP_HELP_RELATED_GUIDES;
}
