import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { REVIEW_GUIDE_HELP_TOPIC_LABEL } from "@/lib/review-guide-help-evidence-copy";
import { REVIEW_PACKAGES_HELP_INBOUND_LABEL } from "@/lib/review-packages-help-title-honesty-surfaces";

/** TB-1640 — at most three related help guides; workspace compare/replay links live in Sources. */
export const COMPARISON_REPLAY_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: REVIEW_PACKAGES_HELP_INBOUND_LABEL, href: inAppHelpHref("review-packages") },
  { label: REVIEW_GUIDE_HELP_TOPIC_LABEL, href: inAppHelpHref("review-guide") },
] as const;

export const COMPARISON_REPLAY_HELP_RELATED_HEADING = "Related help" as const;

export const COMPARISON_REPLAY_HELP_RELATED_TEST_ID = "help-comparison-replay-related-help";

/** Related guides for `/help/comparison-replay`. */
export function comparisonReplayHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return COMPARISON_REPLAY_HELP_RELATED_GUIDES;
}
