import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { resolveRelatedFollowUpsTitle } from "@/lib/help/related-follow-ups-title";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** TB-1724 / TB-1725 — at most three related help guides; first-review steps stay on core-pilot. */
export const PILOT_GUIDE_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "First review guide", href: FIRST_REVIEW_GUIDE_PATH },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

export const PILOT_GUIDE_HELP_RELATED_HEADING = resolveRelatedFollowUpsTitle(PILOT_GUIDE_HELP_RELATED_GUIDES);

export const PILOT_GUIDE_HELP_RELATED_TEST_ID = "help-pilot-guide-related-help";

/** Related guides for `/help/pilot-guide`. */
export function pilotGuideHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return PILOT_GUIDE_HELP_RELATED_GUIDES;
}
