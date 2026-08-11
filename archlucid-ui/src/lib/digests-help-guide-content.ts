import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";

export const DIGESTS_HELP_PAGE_TITLE = "Architecture digests";

export const DIGESTS_HELP_PAGE_SUBTITLE =
  "Schedule summaries of review activity, governance signals, findings, and advisory scans for operators.";

export const DIGESTS_HELP_OVERVIEW =
  "Architecture digests send scheduled summaries of workspace review activity. Configure cadence and recipients on the Schedule tab, manage subscriptions, then browse generated digests.";

export const DIGESTS_HELP_PRIMARY_ACTION = {
  label: "See where digests are managed",
  href: "#where-digests-are-managed",
} as const;

export const DIGESTS_HELP_HOW_DIGESTS_WORK_STEPS = [
  "Choose delivery cadence and recipients on the Schedule tab.",
  "Confirm subscription destinations for the people who should receive digests.",
  "ArchLucid generates digests on that cadence from review and governance activity.",
  "Browse generated digests and open reviews or findings when a summary needs follow-up.",
] as const;

export const DIGESTS_HELP_DESTINATION_CARDS = [
  {
    id: "schedule",
    title: "Schedule",
    description: "Set timing, preview, and send a test digest.",
    actionLabel: "Open Schedule",
    href: DIGESTS_SCHEDULE_TAB_PATH,
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    description: "Manage recipient destinations for digest delivery.",
    actionLabel: "Open Subscriptions",
    href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  },
  {
    id: "browse",
    title: "Browse",
    description: "Inspect generated digests and download exports.",
    actionLabel: "Open Browse",
    href: DIGESTS_BROWSE_TAB_PATH,
  },
] as const;

export const DIGESTS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "how-digests-work", title: "How digests work" },
  { level: 2, id: "where-digests-are-managed", title: "Where digests are managed" },
];
