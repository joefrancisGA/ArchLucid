import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_CHANGE_TYPE_FILTER_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_COLUMN_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_GROUP_COLUMN_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_TYPE_COLUMN_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RISK_FILTER_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-drift-help-evidence-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_EYEBROW = "Help topic" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE = GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_BREADCRUMB_TOPIC_TITLE = "Drift & snapshots";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE = GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE_BUYER =
  "Compare inventory snapshots, review semantic drift rows, and export advisory Terraform reconstructed from snapshot evidence." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_CONTENT_ID =
  "help-governance-infrastructure-drift-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SKIP_LINK_LABEL = "Skip to drift and snapshots guide" as const;

export function governanceInfrastructureDriftHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE_BUYER
    : GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE;
}

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW =
  "The drift workbench compares two inventory snapshots and surfaces property-level changes with risk and change-type classification. Use it to understand what changed between captures and to export advisory Terraform reconstructed from snapshot evidence — not original Terraform from your repository.";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION = {
  label: "Open drift workbench",
  href: GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
} as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_CARD_TITLE = "Start here";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_PRECONDITION =
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_BODY;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_HELPER =
  "Drift diffs appear after a second snapshot is captured for the same subscription scope.";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_START_HERE_SECONDARY_ACTION = {
  label: "Open cloud connections",
  href: CLOUD_CONNECTIONS_PATH,
} as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SNAPSHOT_PRECONDITION_TAG = "Inventory snapshots";

export type GovernanceInfrastructureDriftHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TILE_ITEMS: readonly GovernanceInfrastructureDriftHelpTileItem[] = [
  {
    label: "Current snapshot",
    detail: "The inventory capture you are reviewing — pick this first before choosing a diff.",
  },
  {
    label: "Diff vs other snapshot",
    detail: "The baseline snapshot ArchLucid compares against the current capture.",
  },
  {
    label: "Drift rows",
    detail: "Property-level adds, updates, and deletes with risk and change-type labels.",
  },
  {
    label: "Advisory Terraform",
    detail: "Exports are reconstructed from snapshot evidence and require human review before any apply.",
  },
] as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_TITLE = "Reading the drift table";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_BODY =
  "Sort and filter drift rows to narrow large diffs. Resource, resource group, and resource type columns help you find the Azure resource behind each change.";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_COLUMNS: readonly GovernanceInfrastructureDriftHelpTileItem[] = [
  {
    label: GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_COLUMN_LABEL,
    detail: "Azure resource name for the changed row.",
  },
  {
    label: GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_GROUP_COLUMN_LABEL,
    detail: "Resource group that contains the changed resource.",
  },
  {
    label: GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_TYPE_COLUMN_LABEL,
    detail: "ARM resource type for the changed row.",
  },
  {
    label: GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RISK_FILTER_LABEL,
    detail: "Filter rows by classified risk before opening change detail.",
  },
  {
    label: GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_CHANGE_TYPE_FILTER_LABEL,
    detail: "Filter adds, updates, and deletes within the selected diff.",
  },
] as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HOW_IT_WORKS_STEPS = [
  "Connect a read-only cloud account and wait for inventory snapshots to capture.",
  "Pick a current snapshot and a diff snapshot to compare property-level changes.",
  "Filter and sort drift rows, then open change detail or export advisory Terraform when needed.",
] as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID =
  "help-governance-infrastructure-drift-claim-discipline-heading" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-drift-workbench-shows", title: "What the drift workbench shows" },
  { level: 2, id: "how-drift-compare-works", title: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL },
  { level: 2, id: "reading-the-drift-table", title: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_SECTION_TITLE },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: claim band owns diligence limits; overview and steps stay affirmative. */
export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["sealed review record", "official assurance materials"],
  claimMustNotContain: ["sources package", "sealed-review diligence"],
} as const;
