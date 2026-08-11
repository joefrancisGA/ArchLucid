import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE =
  "This audit trail guide explains how immutable events and correlation identifiers support governance review — it is architect help orientation, not a signed-review diligence Sources package. Open Audit, Findings, or Assurance status when you need live trails or assurance surfaces.";

export const AUDIT_TRAIL_HELP_SOURCES_INTRO =
  "Use these follow-ups when audit vocabulary turns into live activity, findings triage, approvals, or assurance orientation.";


/** Operator Sources — no self-href to `/help/audit-trail`. */
export const AUDIT_TRAIL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Findings", href: "/governance/findings" },
  { label: "Governance approval", href: inAppHelpHref("governance-approval") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
