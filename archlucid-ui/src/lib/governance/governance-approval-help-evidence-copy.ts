import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  GOVERNANCE_WORKSPACE_HEALTH_HREF,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH = "/help/governance-approval" as const;

export const GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL = "How governance approval works";

export const GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE =
  "This guide explains workflow, roles, and statuses — open the approval queue, Workspace Health, Findings, or Audit when you need live decisions or governed trails.";

export const GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const GOVERNANCE_APPROVAL_HELP_CLAIM_HEADING_ID =
  "help-governance-approval-claim-discipline-heading" as const;

export const GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO =
  "Use these follow-ups when approval vocabulary turns into live queue work, findings triage, or audit context.";

/** Operator Sources — no self-href to `/help/governance-approval`. */
export const GOVERNANCE_APPROVAL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Workspace health", href: GOVERNANCE_WORKSPACE_HEALTH_HREF },
  { label: "Findings", href: "/governance/findings" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Standards & rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
] as const;
