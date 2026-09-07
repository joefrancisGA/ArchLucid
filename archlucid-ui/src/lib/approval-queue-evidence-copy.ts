import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_WORKSPACE_HEALTH_HREF,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const APPROVAL_QUEUE_CLAIM_DISCIPLINE =
  "This approval queue records submit / approve / reject decisions for architecture reviews in the current workspace — workflow only, not a full audit export. Open Audit or the linked review for the complete record.";

export const APPROVAL_QUEUE_FOLLOW_UPS_TITLE = "Where to go next";

export const APPROVAL_QUEUE_SOURCES_INTRO =
  "Use these follow-ups when a decision needs findings triage, audit trail, workspace health, or approval orientation.";


/** Operator Sources — no self-href to the approval queue. */
export const APPROVAL_QUEUE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Workspace health", href: GOVERNANCE_WORKSPACE_HEALTH_HREF },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started") },
] as const;

export const APPROVAL_QUEUE_CANONICAL_PATH = GOVERNANCE_APPROVAL_QUEUE_PATH;

export const APPROVAL_QUEUE_HELP_TOPIC_LABEL = "How the approval queue works";
