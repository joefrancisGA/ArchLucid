import { CloudCog, Hash, Ticket, Workflow } from "lucide-react";
import type { NavGroupConfig } from "@/lib/nav-config.types";
import {
  INTEGRATIONS_AZURE_BOARDS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { AZURE_BOARDS_SURFACE_ICON } from "@/lib/azure-boards-surface-icon";
import { TEAMS_SURFACE_ICON } from "@/lib/teams-surface-icon";
import { WEBHOOKS_SURFACE_ICON } from "@/lib/webhooks-surface-icon";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · integrations — product-specific connector configuration surfaces. */
export class OperateIntegrationsNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-integrations",
      label: OPERATOR_NAV_GROUP_LABELS.integrations,
      surface: "review-workflow",
      caption: "Connect evidence sources and send events to external systems.",
      links: [
        {
          href: "/integrations/cloud-connections",
          label: OPERATOR_NAV_LINK_LABELS.cloudConnections,
          title: OPERATOR_NAV_LINK_LABELS.cloudConnections,
          icon: CloudCog,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: INTEGRATIONS_JIRA_PATH,
          label: OPERATOR_NAV_LINK_LABELS.jira,
          title: OPERATOR_NAV_LINK_LABELS.jira,
          icon: Ticket,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: INTEGRATIONS_AZURE_BOARDS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.azureBoards,
          title: OPERATOR_NAV_LINK_LABELS.azureBoards,
          icon: AZURE_BOARDS_SURFACE_ICON,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: INTEGRATIONS_SERVICENOW_PATH,
          label: OPERATOR_NAV_LINK_LABELS.servicenow,
          title: OPERATOR_NAV_LINK_LABELS.servicenow,
          // Workflow evokes ITSM/service-desk routing; no Lucide ServiceNow mark in-tree.
          icon: Workflow,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: INTEGRATIONS_TEAMS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.microsoftTeams,
          title: OPERATOR_NAV_LINK_LABELS.microsoftTeams,
          icon: TEAMS_SURFACE_ICON,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: INTEGRATIONS_SLACK_PATH,
          label: OPERATOR_NAV_LINK_LABELS.slack,
          title: OPERATOR_NAV_LINK_LABELS.slack,
          icon: Hash,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: INTEGRATIONS_WEBHOOKS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.webhooks,
          title: OPERATOR_NAV_LINK_LABELS.webhooks,
          icon: WEBHOOKS_SURFACE_ICON,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
      ],
    };
  }
}
