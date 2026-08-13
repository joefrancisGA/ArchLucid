import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SUBPROCESSORS_HELP_CANONICAL_PATH = "/help/subprocessors" as const;

export const SUBPROCESSORS_HELP_CLAIM_DISCIPLINE =
  "This Subprocessors register orients buyers and architects on hosted-service processors — it is help orientation, not a countersigned DPA. Open the DPA template or Security and trust when you need procurement or assurance materials.";

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

export const SUBPROCESSORS_HELP_REGISTER_STATUS_LABEL = "Current register" as const;

export function formatSubprocessorsHelpReviewedCopy(lastReviewed: string): string {
  return `Register reviewed ${lastReviewed} — current subprocessor list for hosted ArchLucid SaaS.`;
}

export const SUBPROCESSORS_HELP_PRIMARY_ACTION = {
  label: "Open DPA template",
  href: inAppHelpHref("dpa-template"),
  testId: "help-subprocessors-primary-action",
} as const;
