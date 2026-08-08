import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH = "/help/governance-approval" as const;

export const GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE =
  "This governance approval guide explains workflow, roles, and statuses — it is not a signed-review diligence Sources package. Open the approval queue, Workspace Health, Findings, or Audit when you need live decisions or governed trails.";

export const GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO =
  "Use these follow-ups when orientation turns into live approvals, findings triage, or audit trails.";

export type GovernanceApprovalHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/governance-approval`. */
export const GOVERNANCE_APPROVAL_HELP_SOURCES: readonly GovernanceApprovalHelpSourceLink[] = [
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Workspace Health", href: GOVERNANCE_WORKSPACE_HEALTH_HREF },
  { label: "Findings", href: "/governance/findings" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
] as const;
