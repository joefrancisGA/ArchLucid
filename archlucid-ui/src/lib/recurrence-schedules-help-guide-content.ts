import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  RECURRENCE_SCHEDULE_EXAMPLES,
  RECURRENCE_SCHEDULES_MANAGE_PATH,
  RECURRENCE_SCHEDULES_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
  RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
  RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
} from "@/lib/recurrence-schedules-copy";
import {
  DIGEST_RECURRENCE_SCHEDULE_HEADING,
  DIGEST_RECURRENCE_SCHEDULE_WHY_TWO,
} from "@/lib/vocabulary/digest-recurrence-schedule-vocabulary";

export const RECURRENCE_SCHEDULES_HELP_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.recurrenceSchedules;

export const RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE = RECURRENCE_SCHEDULES_PAGE_SUBTITLE;

export const RECURRENCE_SCHEDULES_HELP_OVERVIEW =
  "Recurrence schedules automate follow-up architecture reviews on a repeating cadence. When a schedule fires, ArchLucid clones the anchored review so your team can re-assess accepted risks, policy exceptions, and control obligations before they lapse.";

export const RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION = {
  label: "Open recurrence schedules",
  href: RECURRENCE_SCHEDULES_MANAGE_PATH,
} as const;

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
    label: "Governance approval when required",
    sourceSurface: "Approval queue",
    href: RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
  },
  {
    label: "Risk and finding disposition",
    sourceSurface: "Governance findings",
    href: RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
  },
] as const;

export const RECURRENCE_SCHEDULES_HELP_HOW_IT_WORKS_STEPS = [
  "Choose a finalized governed architecture review to anchor the schedule.",
  "Define the cadence — quarterly control checks, annual attestations, weekly remediation follow-ups, or board checkpoints.",
  "When the cadence fires, open the cloned review, triage new findings, and route governance decisions on linked surfaces.",
] as const;

export const RECURRENCE_SCHEDULES_HELP_EXAMPLES_SECTION_TITLE = "Common schedule examples";

export const RECURRENCE_SCHEDULES_HELP_EXAMPLES = RECURRENCE_SCHEDULE_EXAMPLES;

export const RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_SECTION_TITLE = DIGEST_RECURRENCE_SCHEDULE_HEADING;

export const RECURRENCE_SCHEDULES_HELP_SCHEDULE_KIND_BODY = DIGEST_RECURRENCE_SCHEDULE_WHY_TWO;

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
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
