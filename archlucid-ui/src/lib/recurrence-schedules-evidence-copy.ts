import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_RECURRENCE_SCHEDULES_PATH } from "@/lib/governance/recurrence-schedules-route";

export const RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE =
  "Recurrence schedules set when architecture reviews repeat — not a full audit export. Open Findings, approval queue, or Audit when you need resolution history or approval records.";

export const RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const RECURRENCE_SCHEDULES_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "schedule setup needs package context, risk triage, or approval workflow",
);


/** Operator Sources — no self-href to recurrence-schedules. */
export const RECURRENCE_SCHEDULES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
] as const;

const RECURRENCE_SCHEDULES_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  GOVERNANCE_RECURRENCE_SCHEDULES_PATH,
]);

/** Operator orientation Sources — excludes self-href to `/governance/recurrence-schedules` (GRX). */
export const RECURRENCE_SCHEDULES_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = RECURRENCE_SCHEDULES_SOURCES.filter(
  (source) => !RECURRENCE_SCHEDULES_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
