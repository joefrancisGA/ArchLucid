import { FINDINGS_HELP_PATH } from "@/lib/findings-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const FINDINGS_HELP_CANONICAL_PATH = FINDINGS_HELP_PATH;

export const FINDINGS_HELP_CLAIM_DISCIPLINE =
  "This findings guide explains how architecture concerns are inspected and resolved — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Findings, Audit, or a finalized review package when you need live or governed trails.";

export const FINDINGS_HELP_SOURCES_INTRO =
  "Use these follow-ups when a finding needs live triage, evidence search, governance decisions, or product orientation.";

export type FindingsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/findings`. */
export const FINDINGS_HELP_SOURCES: readonly FindingsHelpSourceLink[] = [
  { label: "Findings", href: "/governance/findings" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Decision register", href: "/governance/decision-register" },
  { label: "Audit trail", href: inAppHelpHref("audit-trail") },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
