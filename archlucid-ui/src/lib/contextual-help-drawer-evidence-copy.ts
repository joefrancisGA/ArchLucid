import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const CONTEXTUAL_HELP_DRAWER_CLAIM_DISCIPLINE =
  "Contextual help suggests next steps and in-app documentation — it does not open a finalized review record, evidence trail export, or approval on its own. Follow links into reviews, findings, or audit surfaces before treating guidance as authoritative.";

export const CONTEXTUAL_HELP_DRAWER_CLAIM_HEADING = "Guidance only" as const;

export const CONTEXTUAL_HELP_DRAWER_SOURCES_INTRO =
  "Use these follow-ups when help topics need review context, evidence trails, or findings queue.";

/** Operator Sources for the shell contextual help drawer (HCD). */
export const CONTEXTUAL_HELP_DRAWER_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Help index", href: "/help" },
  { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
] as const;
