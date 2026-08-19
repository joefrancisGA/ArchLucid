import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  SUBPROCESSORS_HELP_PRIMARY_ACTIONS,
} from "@/lib/subprocessors-help-guide-content";
import {
  SUBPROCESSORS_HELP_RELATED_GUIDES,
  subprocessorsHelpRelatedGuides,
} from "@/lib/subprocessors-help-related-guides";

export const SUBPROCESSORS_HELP_CANONICAL_PATH = "/help/subprocessors" as const;

export const SUBPROCESSORS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const SUBPROCESSORS_HELP_CLAIM_DISCIPLINE =
  "This register orients buyers and architects on hosted-service processors — open the DPA template or Security and trust when you need procurement or assurance materials.";

export const SUBPROCESSORS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SUBPROCESSORS_HELP_CLAIM_HEADING_ID = "help-subprocessors-claim-discipline-heading" as const;

export const SUBPROCESSORS_HELP_SOURCES_INTRO =
  "Use these follow-ups when subprocessor vocabulary turns into DPA negotiation, trust-center materials, or data-handling diligence.";

/** Operator Sources — no self-href to `/help/subprocessors`. */
export const SUBPROCESSORS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "DPA template", href: inAppHelpHref("dpa-template") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Data handling", href: inAppHelpHref("data-handling") },
  { label: "Tenant isolation", href: inAppHelpHref("data-handling") },
  { label: "Procurement", href: inAppHelpHref("procurement") },
] as const;

const SUBPROCESSORS_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.href,
  SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openDpaTemplate.href,
  SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openSecurityTrust.href,
]);

/** Orientation-strip Sources — excludes Continue diligence action-panel destinations. */
export const SUBPROCESSORS_HELP_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  SUBPROCESSORS_HELP_SOURCES.filter(
    (source) => !SUBPROCESSORS_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );

export const SUBPROCESSORS_HELP_REGISTER_STATUS_LABEL = "Current register" as const;

export function formatSubprocessorsHelpReviewedCopy(lastReviewed: string): string {
  return `Register reviewed ${lastReviewed} — current subprocessor list for hosted ArchLucid SaaS.`;
}

/** Primary CTA — Trust Center diligence pack (TB-1751). */
export const SUBPROCESSORS_HELP_PRIMARY_ACTION = {
  label: SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.label,
  href: SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.href,
  testId: SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.testId,
} as const;

export const SUBPROCESSORS_HELP_RELATED = subprocessorsHelpRelatedGuides();

export const SUBPROCESSORS_HELP_RELATED_HEADING = "Related help" as const;

export { SUBPROCESSORS_HELP_RELATED_GUIDES };
