/** Workspace settings surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  TENANT_SETTINGS_CANONICAL_PATH,
  WORKSPACE_SETTINGS_HELP_TOPIC_LABEL,
} from "@/lib/tenant-settings-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_CANONICAL_PATH } from "@/lib/workspace-settings-help-evidence-copy";

const WORKSPACE_SETTINGS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Workspace settings — configure tenant-wide defaults, quality gates, cost settings, and organization options.",
  whatToDoNext:
    "Review workspace scope, adjust quality gates or cost settings when needed, then open Projects recycle bin to restore deleted architecture projects.",
  whyEmpty:
    "Cards always render for authorized Admins; empty technical scope values mean the workspace switcher has not selected a tenant, workspace, or project yet.",
  whereToConfigurePrerequisite:
    "Changing tenant defaults needs Admin authority; active workspace and project selection lives in the header workspace switcher.",
  taskSteps: [
    "Confirm tenant, workspace, and project scope in the header switcher.",
    "Adjust quality gates or cost settings when defaults need tuning.",
    "Open Projects recycle bin when you need to restore deleted projects.",
  ],
} as const;

const PROJECTS_RECYCLE_BIN_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Projects recycle bin — browse soft-deleted architecture projects for this tenant and restore them when names are free.",
  whatToDoNext:
    "Refresh the list, restore a deleted project when you have Execute authority, then open Architectures or Workspace settings to continue work.",
  whyEmpty:
    "Empty means no soft-deleted projects remain in the retention window, or the recycle-bin API has not returned rows yet.",
  whereToConfigurePrerequisite:
    "Browsing needs Admin access; restore requires Execute authority. Retention and workspace scope live under Workspace settings.",
  taskSteps: [
    "Refresh the list of soft-deleted projects.",
    "Restore a project when the name is free and you have Execute authority.",
    "Open Architectures or Workspace settings to continue work.",
  ],
} as const;

export const WORKSPACE_SETTINGS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: TENANT_SETTINGS_CANONICAL_PATH,
    entry: WORKSPACE_SETTINGS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/administration/workspace-settings/recycle-bin",
    entry: PROJECTS_RECYCLE_BIN_CONTEXTUAL_HELP,
  },
  {
    prefix: WORKSPACE_SETTINGS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Workspace settings — ${WORKSPACE_SETTINGS_HELP_TOPIC_LABEL.toLowerCase()} and how tenant defaults differ from personal preferences.`,
      whatToDoNext:
        "Open workspace settings to review tenant defaults, then follow scope or recycle-bin surfaces when restore work is needed.",
      whyEmpty: "This guide is always available; settings cards render for authorized Admins.",
      whereToConfigurePrerequisite:
        "Workspace and scope help explains tenant, workspace, and project selection vocabulary.",
      whatToDoNextAction: {
        label: "Open workspace settings",
        href: TENANT_SETTINGS_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read workspace and scope help",
        href: "/help/scope",
      },
    },
  },
];
