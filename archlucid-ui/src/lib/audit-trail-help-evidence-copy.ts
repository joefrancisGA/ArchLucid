import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUDIT_TRAIL_HELP_CANONICAL_PATH = "/help/audit-trail" as const;

export const AUDIT_TRAIL_HELP_TOPIC_LABEL = "How the audit trail works" as const;

export const AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE =
  "This audit trail guide explains how immutable events and correlation identifiers support governance review — it is architect help orientation, not a sealed-review diligence Sources package. Open Audit, Findings, or Assurance status when you need live trails or assurance surfaces.";

export const AUDIT_TRAIL_HELP_SOURCES_INTRO =
  "Use these follow-ups when audit vocabulary turns into live activity, findings triage, approvals, or assurance orientation.";


/** Operator Sources — no self-href to `/help/audit-trail`. */
export const AUDIT_TRAIL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Governance approval", href: inAppHelpHref("governance-approval") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
