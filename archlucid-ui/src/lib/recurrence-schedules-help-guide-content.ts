import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  RECURRENCE_SCHEDULE_EXAMPLES,
  RECURRENCE_SCHEDULES_HELPER_NEXT_STEP,
  RECURRENCE_SCHEDULES_MANAGE_PATH,
  RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
  RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
  RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
} from "@/lib/recurrence-schedules-copy";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING,
  RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS_TITLE,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import {
  DIGEST_RECURRENCE_SCHEDULE_HEADING,
  DIGEST_RECURRENCE_SCHEDULE_WHY_TWO,
} from "@/lib/vocabulary/digest-recurrence-schedule-vocabulary";

export const RECURRENCE_SCHEDULES_HELP_PAGE_EYEBROW = "Help topic" as const;

export const RECURRENCE_SCHEDULES_HELP_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.recurrenceSchedules;

export const RECURRENCE_SCHEDULES_HELP_BREADCRUMB_TOPIC_TITLE = "Recurrence schedules";

export const RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE =
  "Orient on automated follow-up review cadences — schedule kinds, health signals, and where to manage schedules.";

export const RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE_BUYER =
  "Automated follow-up review cadences, schedule health signals, and where to manage schedules in this workspace." as const;

export const RECURRENCE_SCHEDULES_HELP_PRIMARY_CONTENT_ID = "help-recurrence-schedules-primary-content" as const;

export const RECURRENCE_SCHEDULES_HELP_SKIP_LINK_LABEL = "Skip to recurrence schedules guide" as const;

export function recurrenceSchedulesHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE_BUYER
    : RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE;
}

export const RECURRENCE_SCHEDULES_HELP_OVERVIEW =
  "Recurrence schedules automate follow-up architecture reviews on a repeating cadence. When a schedule fires, ArchLucid clones the anchored review so your team can re-assess accepted risks, policy exceptions, and control obligations before they lapse.";

export const RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION = {
  label: "Open recurrence schedules",
  href: RECURRENCE_SCHEDULES_MANAGE_PATH,
} as const;

export const RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION = RECURRENCE_SCHEDULES_HELPER_NEXT_STEP;

/** Compact finalized-review tag beside the primary action. */
export const RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION_TAG = "Finalized review";

export const RECURRENCE_SCHEDULES_HELP_AUTOMATION_SECTION_TITLE = "What a schedule automates";

export type RecurrenceSchedulesHelpAutomationItem = {
  readonly label: string;
  readonly sourceSurface: string;
  readonly href: string;
};

export const RECURRENCE_SCHEDULES_HELP_AUTOMATION_ITEMS: readonly RecurrenceSchedulesHelpAutomationItem[] = [
  {
    label: "Follow-up architecture review",
    sourceSurface: "Architecture reviews",
    href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
  },
  {
    label: "Resolve outcomes when required",
    sourceSurface: "Approval queue",
    href: RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
  },
  {
    label: "Risk and finding disposition",
    sourceSurface: "Findings queue",
    href: RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
  },
] as const;

export const RECURRENCE_SCHEDULES_HELP_HOW_IT_WORKS_STEPS = [
  "Choose a finalized architecture review to anchor the schedule.",
  "Define the cadence — quarterly control checks, annual attestations, weekly remediation follow-ups, or board checkpoints.",
  "When the cadence fires, open the cloned review, triage new findings, and route approval decisions on linked surfaces.",
] as const;

export const RECURRENCE_SCHEDULES_HELP_EXAMPLES_SECTION_TITLE = "Common schedule examples";

export const RECURRENCE_SCHEDULES_HELP_EXAMPLES = RECURRENCE_SCHEDULE_EXAMPLES;

export const RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_SECTION_TITLE = DIGEST_RECURRENCE_SCHEDULE_HEADING;

export const RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_BODY = DIGEST_RECURRENCE_SCHEDULE_WHY_TWO;

export const RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID = "help-recurrence-schedules-claim-discipline-heading" as const;

export const RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  {
    level: 2,
    id: "what-a-schedule-automates",
    title: RECURRENCE_SCHEDULES_HELP_AUTOMATION_SECTION_TITLE,
  },
  { level: 2, id: "how-recurrence-schedules-work", title: "How recurrence schedules work" },
  { level: 2, id: "common-schedule-examples", title: RECURRENCE_SCHEDULES_HELP_EXAMPLES_SECTION_TITLE },
  {
    level: 2,
    id: "two-different-kinds-of-schedule",
    title: RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_SECTION_TITLE,
  },
  {
    level: 2,
    id: "schedule-health-and-trust",
    title: RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS_TITLE,
  },
  {
    level: 2,
    id: RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID,
    title: RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: claim band owns diligence limits; overview and steps stay affirmative. */
export const RECURRENCE_SCHEDULES_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a finalized review record", "digest delivery receipt"],
  claimMustNotContain: ["sources package", "sealed-review diligence"],
} as const;
