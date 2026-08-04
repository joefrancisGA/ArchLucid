import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH = "/help/governance-approval" as const;

export const GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE =
  "This governance approval guide explains workflow, roles, and statuses — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Approvals, Workspace Health, Findings, or Audit when you need live decisions or governed trails.";

export const GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO =
  "Use these follow-ups when orientation turns into live approvals, findings triage, or audit trails.";

export type GovernanceApprovalHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/governance-approval`. */
export const GOVERNANCE_APPROVAL_HELP_SOURCES: readonly GovernanceApprovalHelpSourceLink[] = [
  { label: "Approvals", href: "/governance/approvals" },
  { label: "Workspace Health", href: "/governance/dashboard" },
  { label: "Findings", href: "/governance/findings" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
] as const;
