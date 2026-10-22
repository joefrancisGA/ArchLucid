/** Azure Boards integration surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
  AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL,
} from "@/lib/azure-boards-integration-evidence-copy";
import { AZURE_BOARDS_HELP_CANONICAL_PATH } from "@/lib/azure-boards-help-evidence-copy";

const AZURE_BOARDS_INTEGRATION_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Azure Boards integration — outbound work-item settings, connection health, and default behavior for creating Azure Boards work items from ArchLucid.",
  whatToDoNext:
    "Test the connector, set organization project and work-item defaults, then open Integration readiness when the path is not ready.",
  whyEmpty: "Health and settings load after this workspace can reach the Azure Boards connector configuration.",
  whereToConfigurePrerequisite:
    "Organization URL and credential references are often configured by an administrator; saving settings needs Operate authority.",
  taskSteps: [
    "Test the connector to confirm Azure Boards credentials work.",
    "Set organization, project, and work-item defaults.",
    "Open Integration readiness when the connector path is not ready yet.",
  ],
} as const;

export const AZURE_BOARDS_INTEGRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
    entry: AZURE_BOARDS_INTEGRATION_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: AZURE_BOARDS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Azure Boards integration — ${AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL.toLowerCase()} and connector setup.`,
      whatToDoNext:
        "Open Azure Boards settings to connect or test the destination, then confirm Integration readiness.",
      whyEmpty: "This guide is always available; live connector status appears after Azure DevOps is configured for the workspace.",
      whereToConfigurePrerequisite:
        "Outbound work-item creation needs a role that can manage integrations for this workspace.",
      whatToDoNextAction: {
        label: "Open Azure Boards settings",
        href: AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Open Integration readiness help",
        href: "/help/integration-readiness",
      },
    },
  },
];
