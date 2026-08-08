import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE =
  "Recurrence schedules configure when architecture reviews repeat — they are not a signed-review diligence Sources package. Open Findings, approval queue, or Audit when you need disposition or activity trails.";

export const RECURRENCE_SCHEDULES_SOURCES_INTRO =
  "Use these follow-ups when schedule setup needs package context, risk triage, or approval workflow.";

export type RecurrenceSchedulesSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to recurrence-schedules. */
export const RECURRENCE_SCHEDULES_SOURCES: readonly RecurrenceSchedulesSourceLink[] = [
  { label: "Governance findings", href: "/governance/findings" },
  { label: "Approval queue", href: "/governance/approval-queue" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;
