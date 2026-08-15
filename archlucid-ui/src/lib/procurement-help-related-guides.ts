import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { DPA_TEMPLATE_HELP_PAGE_TITLE } from "@/lib/dpa-template-help-guide-content";
import { SECURITY_TRUST_HELP_TOPIC_LABEL } from "@/lib/security-trust-help-evidence-copy";
import { SOC2_SELF_ASSESSMENT_HELP_TOPIC_LABEL } from "@/lib/soc2-self-assessment-help-guide-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** TB-2275 — at most three related diligence guides for the procurement FAQ job. */
export const PROCUREMENT_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: SECURITY_TRUST_HELP_TOPIC_LABEL, href: inAppHelpHref("security-trust") },
  { label: SOC2_SELF_ASSESSMENT_HELP_TOPIC_LABEL, href: inAppHelpHref("soc2-self-assessment") },
  { label: DPA_TEMPLATE_HELP_PAGE_TITLE, href: inAppHelpHref("dpa-template") },
] as const;

export const PROCUREMENT_HELP_RELATED_HEADING = "Related help" as const;

export const PROCUREMENT_HELP_RELATED_TEST_ID = "help-procurement-related-help";

/** Related guides for `/help/procurement`. */
export function procurementHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return PROCUREMENT_HELP_RELATED_GUIDES;
}
