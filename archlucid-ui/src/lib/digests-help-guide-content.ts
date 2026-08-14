import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";

export const DIGESTS_HELP_PAGE_TITLE = "Architecture digests";

export const DIGESTS_HELP_PAGE_SUBTITLE =
  "Schedule summaries of review activity, governance signals, findings, and advisory scans for operators.";

export const DIGESTS_HELP_OVERVIEW =
  "Architecture digests are summary reports generated after advisory scans and delivered to subscription destinations. Use Schedule for the separate sponsor sponsor rollup, Subscriptions for architecture digest destinations, and Browse for generated digests.";

export const DIGESTS_HELP_PRIMARY_ACTION = {
  label: "Open digests Schedule",
  href: DIGESTS_SCHEDULE_TAB_PATH,
} as const;

export const DIGESTS_HELP_CONTENT_SECTION_TITLE = "What a digest contains";

export type DigestsHelpContentItem = {
  readonly label: string;
  readonly sourceSurface: string;
  readonly href: string;
};

export const DIGESTS_HELP_CONTENT_ITEMS: readonly DigestsHelpContentItem[] = [
  {
    label: "Review activity",
    sourceSurface: "Architecture reviews",
    href: "/architecture/reviews",
  },
  {
    label: "Governance signals",
    sourceSurface: "Governance approval queue",
    href: "/governance/approval-queue",
  },
  {
    label: "Findings summary",
    sourceSurface: "Governance findings",
    href: "/governance/findings",
  },
  {
    label: "Advisory scan results",
    sourceSurface: "Advisory scan schedules",
    href: ADVISORY_SCANS_SCHEDULES_HREF,
  },
] as const;

export const DIGESTS_HELP_SAMPLE_DIGEST_TITLE = "Example digest summary";

export const DIGESTS_HELP_SAMPLE_DIGEST_PERIOD = "Week of 4–10 Aug 2026";

export const DIGESTS_HELP_SAMPLE_DIGEST_LINES = [
  "3 architecture reviews progressed; 1 sealed review record finalized.",
  "2 governance approval requests awaiting architect action.",
  "5 open findings — 2 critical severity in production scope.",
  "Weekly advisory scan completed; 1 new finding surfaced.",
] as const;

export const DIGESTS_HELP_SAMPLE_DIGEST_BROWSE_LABEL = "Open generated digests in Browse";

export const DIGESTS_HELP_HOW_DIGESTS_WORK_STEPS = [
  "Enable an advisory scan schedule so architecture digests generate on a cadence.",
  "Add subscription destinations so recipients receive those digests after each scan.",
  "Open Browse to inspect generated digests; use Schedule for the separate sponsor sponsor rollup.",
] as const;

export const DIGESTS_HELP_DESTINATION_CARDS = [
  {
    id: "schedule",
    title: "Schedule",
    description: "Configure the sponsor sponsor rollup email (separate from advisory scan cadence).",
    actionLabel: "Open Schedule",
    href: DIGESTS_SCHEDULE_TAB_PATH,
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    description: "Manage destinations that receive architecture digests after advisory scans.",
    actionLabel: "Open Subscriptions",
    href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  },
  {
    id: "browse",
    title: "Browse",
    description: "Inspect generated architecture digests and download exports.",
    actionLabel: "Open Browse",
    href: DIGESTS_BROWSE_TAB_PATH,
  },
] as const;

export const DIGESTS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-a-digest-contains", title: DIGESTS_HELP_CONTENT_SECTION_TITLE },
  { level: 2, id: "how-digests-work", title: "How digests work" },
  { level: 2, id: "where-digests-are-managed", title: "Where digests are managed" },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
