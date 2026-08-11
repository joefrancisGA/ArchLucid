import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance-route-paths";

export const RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE =
  "Recurrence schedules configure when architecture reviews repeat — they are not a signed-review diligence Sources package. Open Findings, approval queue, or Audit when you need disposition or activity trails.";

export const RECURRENCE_SCHEDULES_SOURCES_INTRO =
  "Use these follow-ups when schedule setup needs package context, risk triage, or approval workflow.";


/** Operator Sources — no self-href to recurrence-schedules. */
export const RECURRENCE_SCHEDULES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;
