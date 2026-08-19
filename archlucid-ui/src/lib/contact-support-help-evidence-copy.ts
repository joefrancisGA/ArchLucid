import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const CONTACT_SUPPORT_HELP_CLAIM_DISCIPLINE =
  "This page routes architects to Report problem, email support, and redacted diagnostics bundles — it is not a live ticket queue or a sealed diligence Sources package.";

export const CONTACT_SUPPORT_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const CONTACT_SUPPORT_HELP_CLAIM_HEADING_ID = "help-contact-support-claim-discipline-heading" as const;

export const CONTACT_SUPPORT_HELP_SOURCES_INTRO =
  "Use these follow-ups when support routing turns into structured intake, symptom triage, or trust-center diligence.";

/** Operator Sources — no self-href to `/help/contact-support`. */
export const CONTACT_SUPPORT_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
] as const;
