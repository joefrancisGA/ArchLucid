/** Recurrence schedules hub and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  RECURRENCE_SCHEDULES_MANAGE_PATH,
  RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
} from "@/lib/recurrence-schedules-copy";
import { RECURRENCE_SCHEDULES_HELP_CANONICAL_PATH } from "@/lib/recurrence-schedules-help-evidence-copy";

const RECURRENCE_SCHEDULES_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Automate follow-up architecture reviews on a repeating cadence for governed reviews that need periodic re-assessment.",
  whatToDoNext: "Create a schedule from a finalized review, then monitor cadence, status, and last-run health on this page.",
  whyEmpty: "Schedules appear after you create one for a finalized architecture review.",
  whereToConfigurePrerequisite:
    "Finalize an architecture review and complete governance approval when your workspace requires it before scheduling follow-up.",
  whatToDoNextAction: {
    label: "Open architecture reviews",
    href: RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
  },
  whereToConfigureAction: {
    label: "Manage recurrence schedules",
    href: RECURRENCE_SCHEDULES_MANAGE_PATH,
  },
} as const;

export const RECURRENCE_SCHEDULES_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: RECURRENCE_SCHEDULES_MANAGE_PATH,
    entry: RECURRENCE_SCHEDULES_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: RECURRENCE_SCHEDULES_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Recurrence schedules — how automated re-review cadences are created, monitored, and distinguished from sponsor digest email.",
      whatToDoNext: "Open recurrence schedules to create or edit a cadence, then follow cloned reviews through governance surfaces.",
      whyEmpty: "This guide is always available; schedules appear after you create one from a finalized review.",
      whereToConfigurePrerequisite:
        "Anchor each schedule to a finalized governed architecture review before defining cadence.",
      whatToDoNextAction: {
        label: "Open recurrence schedules",
        href: RECURRENCE_SCHEDULES_MANAGE_PATH,
      },
    },
  },
];
