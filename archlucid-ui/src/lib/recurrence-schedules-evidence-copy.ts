import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE =
  "Recurrence schedules set when architecture reviews repeat — not a full audit export. Open Findings, approval queue, or Audit when you need resolution history or approval records.";

export const RECURRENCE_SCHEDULES_SOURCES_INTRO =
  "Use these follow-ups when schedule setup needs package context, risk triage, or approval workflow.";


/** Operator Sources — no self-href to recurrence-schedules. */
export const RECURRENCE_SCHEDULES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Resolve outcomes help", href: inAppHelpHref("governance-approval") },
] as const;
