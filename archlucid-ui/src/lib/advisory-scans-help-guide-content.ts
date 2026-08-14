import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ADVISORY_SCANS_CANONICAL_PATH } from "@/lib/advisory-scans-evidence-copy";
import { ADVISORY_SCANS_HELP_TOPIC_LABEL } from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_SCANS_HREF, ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const ADVISORY_SCANS_HELP_PAGE_TITLE = "Advisory scans";

export const ADVISORY_SCANS_HELP_PAGE_SUBTITLE =
  "Generate prioritized follow-up recommendations from finalized architecture reviews.";

export const ADVISORY_SCANS_HELP_OVERVIEW =
  "Advisory scans surface follow-up work from finalized reviews. They prioritize architect attention — not a signed-review diligence Sources package.";

/** Matches AdvisoryHubClient reader-rank precondition copy (schedules tab + scan generation). */
export const ADVISORY_SCANS_HUB_READER_ROLE_PRECONDITION =
  "View schedules and executions; creating schedules and running scans now requires a management role.";

export const ADVISORY_SCANS_HELP_START_HERE_CARD_TITLE = "Start here";

export const ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK = {
  label: "Finalize an architecture review",
  href: "/architecture/reviews",
} as const;

export const ADVISORY_SCANS_HELP_PRIMARY_ACTION = {
  label: "Open advisory scans",
  href: ADVISORY_SCANS_CANONICAL_PATH,
} as const;

export type AdvisoryScansHelpTileItem = {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

export const ADVISORY_SCANS_HELP_TILE_ITEMS: readonly AdvisoryScansHelpTileItem[] = [
  {
    label: "Scan generation",
    detail: "Run a scan from a finalized review to produce prioritized follow-up recommendations.",
    href: ADVISORY_SCANS_SCANS_HREF,
  },
  {
    label: "Schedules",
    detail: "Open the Schedules tab when recurring advisory scans should run on a cadence.",
    href: ADVISORY_SCANS_SCHEDULES_HREF,
  },
  {
    label: "Findings triage",
    detail: "Follow linked findings when a scan surfaces material architecture concerns.",
    href: GOVERNANCE_FINDINGS_PATH,
  },
  {
    label: "Architecture digests",
    detail: "Digest subscriptions can include advisory scan summaries when configured.",
    href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  },
] as const;

export const ADVISORY_SCANS_HELP_HOW_TO_READ_STEPS = [
  "Finalize an architecture review that should drive follow-up recommendations.",
  "Generate a scan or configure a schedule on the Schedules tab.",
  "Open findings or audit when a recommendation needs governed triage.",
] as const;

export const ADVISORY_SCANS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-advisory-scans-show", title: "What advisory scans show" },
  { level: 2, id: "how-advisory-scans-work", title: ADVISORY_SCANS_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
