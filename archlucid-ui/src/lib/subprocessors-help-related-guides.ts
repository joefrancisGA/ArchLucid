import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { DPA_TEMPLATE_HELP_PAGE_TITLE } from "@/lib/dpa-template-help-guide-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TRUST_CENTER_CANONICAL_PATH } from "@/lib/trust-center-evidence-copy";

/** TB-1751 — at most three related diligence guides for the subprocessors job. */
export const SUBPROCESSORS_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: DPA_TEMPLATE_HELP_PAGE_TITLE, href: inAppHelpHref("dpa-template") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Trust Center", href: TRUST_CENTER_CANONICAL_PATH },
] as const;

export const SUBPROCESSORS_HELP_RELATED_HEADING = "Related help" as const;

export const SUBPROCESSORS_HELP_RELATED_TEST_ID = "help-subprocessors-related-help";

/** Related guides for `/help/subprocessors`. */
export function subprocessorsHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return SUBPROCESSORS_HELP_RELATED_GUIDES;
}
