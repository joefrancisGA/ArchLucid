import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/workspace-settings-help-evidence-copy";
import {
  TENANT_SETTINGS_CANONICAL_PATH,
  WORKSPACE_SETTINGS_HELP_TOPIC_LABEL,
} from "@/lib/tenant-settings-evidence-copy";

export const WORKSPACE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE = "Workspace settings";

export const WORKSPACE_SETTINGS_HELP_PAGE_EYEBROW = "Help topic" as const;

export const WORKSPACE_SETTINGS_HELP_PAGE_TITLE = "Workspace settings orientation";

export const WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE =
  "How tenant-wide defaults, quality gates, and cost settings fit workspace administration and downstream reviews.";

export const WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE_BUYER =
  "Tenant defaults, quality gates, and cost settings for workspace administration in this workspace." as const;

export const WORKSPACE_SETTINGS_HELP_PRIMARY_CONTENT_ID = "help-workspace-settings-primary-content" as const;

export const WORKSPACE_SETTINGS_HELP_SKIP_LINK_LABEL = "Skip to workspace settings guide" as const;

export function workspaceSettingsHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE_BUYER
    : WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE;
}

export const WORKSPACE_SETTINGS_HELP_OVERVIEW =
  "Workspace settings is the Admin surface for tenant-wide defaults. It configures quality gates and cost settings that downstream reviews inherit.";

export const WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION = {
  label: "Open workspace settings",
  href: TENANT_SETTINGS_CANONICAL_PATH,
} as const;

export const WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE = WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION.label;

export const WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_ID = "help-workspace-settings-admin-precondition" as const;

export const WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION_LABEL = "Admin authority.";

export const WORKSPACE_SETTINGS_HELP_ADMIN_PRECONDITION =
  "Changing tenant defaults needs Admin authority; active workspace and project selection lives in the header workspace switcher.";

export type WorkspaceSettingsHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const WORKSPACE_SETTINGS_HELP_TILE_ITEMS: readonly WorkspaceSettingsHelpTileItem[] = [
  {
    label: "Tenant-wide defaults",
    detail: "Quality gates and cost settings inherited by downstream reviews.",
  },
  {
    label: "Projects recycle bin",
    detail: "Restore soft-deleted architecture projects when names are free.",
  },
] as const;

export const WORKSPACE_SETTINGS_HELP_HOW_TO_READ_STEPS = [
  "Confirm Admin authority and the correct tenant scope before changing defaults.",
  "Review quality gates and cost settings that downstream reviews inherit.",
  "Open projects recycle bin when restore work is the follow-up question.",
] as const;

export const WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_SECTION_ID = "workspace-settings-worked-example" as const;

export const WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_TITLE = "Worked example";

export const WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE = {
  gateName: "Strict AI quality checks",
  before: "Warn-only — low faithfulness scores surface as advisories but the review can still finalize.",
  after: "Block finalize — the same scores stop review finalization until quality checks pass.",
  downstreamEffect:
    "On the next architecture review, new findings may block governance approval until strict AI quality evidence is satisfied.",
} as const;

export const WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_SECTION_ID =
  "workspace-settings-default-change-effects" as const;

export const WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_TITLE =
  "Default changes, audit trail, and sealed review records";

export const WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_BODY =
  "Tenant default changes append to the audit trail with actor, timestamp, and scope. New decisions and governance approvals inherit the updated defaults on the next review cycle. Sealed review records from finalized packages stay immutable — changing defaults does not rewrite sealed history.";

export const WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID = "help-workspace-settings-claim-discipline-heading" as const;

export const WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-workspace-settings-cover", title: "What workspace settings cover" },
  { level: 2, id: "how-workspace-settings-work", title: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_SECTION_ID,
    title: WORKSPACE_SETTINGS_HELP_WORKED_EXAMPLE_TITLE,
  },
  {
    level: 2,
    id: WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_SECTION_ID,
    title: WORKSPACE_SETTINGS_HELP_AUDIT_TRAIL_EFFECT_TITLE,
  },
  {
    level: 2,
    id: WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID,
    title: WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns exclusions once. */
export const WORKSPACE_SETTINGS_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a sealed-review diligence Sources package", "header switcher"],
  claimMustContain: ["not the live Workspace settings Admin surface", "not workspace scope selection"],
} as const;
