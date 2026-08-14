import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/workspace-settings-help-evidence-copy";
import {
  TENANT_SETTINGS_CANONICAL_PATH,
  WORKSPACE_SETTINGS_HELP_TOPIC_LABEL,
} from "@/lib/tenant-settings-evidence-copy";

export const WORKSPACE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE = "Workspace settings";

export const WORKSPACE_SETTINGS_HELP_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.workspaceSettings;

export const WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE =
  "How tenant-wide defaults, quality gates, and cost settings fit workspace administration and downstream reviews.";

export const WORKSPACE_SETTINGS_HELP_OVERVIEW =
  "Workspace settings is the Admin surface for tenant-wide defaults — distinct from the active workspace and project you select in the header switcher. It configures quality gates and cost settings that downstream reviews inherit; it is not a sealed-review diligence Sources package.";

export const WORKSPACE_SETTINGS_HELP_PRIMARY_ACTION = {
  label: "Open workspace settings",
  href: TENANT_SETTINGS_CANONICAL_PATH,
} as const;

export const WORKSPACE_SETTINGS_HELP_START_HERE_CARD_TITLE = "Start here";

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
    detail: "Quality gates, cost settings, and organization options inherited by downstream reviews.",
  },
  {
    label: "Projects recycle bin",
    detail: "Restore soft-deleted architecture projects when names are free.",
  },
  {
    label: "Workspace scope",
    detail: "Active tenant, workspace, and project selection lives in the header switcher.",
  },
  {
    label: "Assurance status",
    detail: "Open assurance status when tenant defaults turn into procurement diligence questions.",
  },
] as const;

export const WORKSPACE_SETTINGS_HELP_HOW_TO_READ_STEPS = [
  "Confirm Admin authority and the correct tenant scope before changing defaults.",
  "Review quality gates and cost settings that downstream reviews inherit.",
  "Open projects recycle bin or scope help when workspace questions turn into restore or scope work.",
] as const;

export const WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID = "help-workspace-settings-claim-discipline-heading" as const;

export const WORKSPACE_SETTINGS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-workspace-settings-cover", title: "What workspace settings cover" },
  { level: 2, id: "how-workspace-settings-work", title: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID,
    title: WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
