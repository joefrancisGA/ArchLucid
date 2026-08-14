import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/digests-route-paths";
import { RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE } from "@/lib/recurrence-schedules-copy";

export const RECURRENCE_SCHEDULES_HELP_CANONICAL_PATH = "/help/recurrence-schedules" as const;

export const RECURRENCE_SCHEDULES_HELP_TOPIC_LABEL = RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE;

export const RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE =
  "This guide explains automated re-review cadences — it is not a sealed review record or digest delivery receipt.";

export const RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const RECURRENCE_SCHEDULES_HELP_SOURCES_INTRO =
  "Use these follow-ups when cadence, schedule health, or follow-up review outcomes still need attention.";

export const RECURRENCE_SCHEDULES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture digests help", href: inAppHelpHref("digests") },
  { label: "Repeat architecture review", href: inAppHelpHref("repeat-review-loop") },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;

export type RecurrenceSchedulesHelpHealthConstraint = {
  readonly label: string;
  readonly detail: string;
};

export const RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS_TITLE = "Schedule health and trust";

export const RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS: readonly RecurrenceSchedulesHelpHealthConstraint[] = [
  {
    label: "Enabled state",
    detail:
      "Disable a schedule when you no longer need automated follow-up; re-enable it when the governed review should resume on cadence.",
  },
  {
    label: "Last run status",
    detail:
      "Each schedule records whether the most recent trigger succeeded or failed so operators can see chronic delivery problems.",
  },
  {
    label: "Auto-disable on repeated failure",
    detail:
      "After several consecutive failed triggers, a schedule auto-disables until an operator reviews the error and re-enables it.",
  },
  {
    label: "Not email cadence",
    detail:
      "Sponsor digest email cadence is configured separately on the Architecture digests Schedule tab.",
  },
] as const;

export const RECURRENCE_SCHEDULES_HELP_DIGEST_SCHEDULE_LINK = {
  label: "Open sponsor digest schedule",
  href: DIGESTS_SCHEDULE_TAB_PATH,
} as const;
