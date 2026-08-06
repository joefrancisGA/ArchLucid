import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUDIT_TRAIL_HELP_CANONICAL_PATH = "/help/audit-trail" as const;

export const AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE =
  "This audit trail guide explains how immutable events and correlation identifiers support governance review — it is operator help orientation, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Audit, Findings, or Assurance status when you need live trails or assurance surfaces.";

export const AUDIT_TRAIL_HELP_SOURCES_INTRO =
  "Use these follow-ups when audit vocabulary turns into live activity, findings triage, approvals, or assurance orientation.";

export type AuditTrailHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/audit-trail`. */
export const AUDIT_TRAIL_HELP_SOURCES: readonly AuditTrailHelpSourceLink[] = [
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Findings", href: "/governance/findings" },
  { label: "Governance approval", href: inAppHelpHref("governance-approval") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
