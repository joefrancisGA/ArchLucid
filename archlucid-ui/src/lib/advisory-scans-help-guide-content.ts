import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ADVISORY_SCANS_CANONICAL_PATH } from "@/lib/advisory-scans-evidence-copy";
import { ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_HELP_TOPIC_LABEL } from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const ADVISORY_SCANS_HELP_PAGE_TITLE = "Advisory scans";

export const ADVISORY_SCANS_HELP_PAGE_SUBTITLE =
  "Generate prioritized follow-up recommendations from finalized architecture reviews.";

export const ADVISORY_SCANS_HELP_OVERVIEW =
  "Advisory scans prioritize follow-up work after a review is finalized. Scan output is recommendations — not a sealed diligence package.";

/** Hub screen-reader hint on Schedules tab when the caller cannot mutate advisory schedules. */
export const ADVISORY_SCANS_HUB_READER_ROLE_PRECONDITION =
  "View schedules and prior scan results; creating schedules and generating scans requires execute access or a management role.";

/** Help Start here card — schedule mutation honesty; not the hub tab screen-reader constant. */
export const ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE =
  "View schedules and prior scan results here; creating schedules and generating scans requires execute access or a management role.";

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
    label: "Schedules",
    detail: "Open the Schedules tab when recurring advisory scans should run on a cadence.",
    href: ADVISORY_SCANS_SCHEDULES_HREF,
  },
  {
    label: "Audit trail",
    detail: "Open audit when a recommendation needs a governed assurance trail with persisted cites.",
    href: GOVERNANCE_AUDIT_PATH,
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

export const ADVISORY_SCANS_HELP_CLAIM_HEADING_ID = "help-advisory-scans-claim-discipline-heading" as const;

export const ADVISORY_SCANS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-advisory-scans-show", title: "What advisory scans show" },
  { level: 2, id: "how-advisory-scans-work", title: ADVISORY_SCANS_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: ADVISORY_SCANS_HELP_CLAIM_HEADING_ID,
    title: ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the diligence negation once. */
export const ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a sealed-review diligence Sources package", "not a diligence Sources package"],
  claimMustContain: "not a sealed-review diligence Sources package",
} as const;
