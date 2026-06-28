import { CloudCog, Hash, Plug, Ticket, UsersRound, Webhook } from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import {
  CLOUD_CONNECTIONS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_ITSM_PATH,
  INTEGRATIONS_READINESS_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

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
          href: INTEGRATIONS_READINESS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.integrationReadiness,
          title: OPERATOR_NAV_LINK_LABELS.integrationReadiness,
          icon: Plug,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/settings/cloud-connections",
          label: OPERATOR_NAV_LINK_LABELS.cloudConnections,
          title: OPERATOR_NAV_LINK_LABELS.cloudConnections,
          icon: CloudCog,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/integrations/itsm",
          label: OPERATOR_NAV_LINK_LABELS.itsm,
          title: OPERATOR_NAV_LINK_LABELS.itsm,
          icon: Ticket,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
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
          href: INTEGRATIONS_SERVICENOW_PATH,
          label: OPERATOR_NAV_LINK_LABELS.servicenow,
          title: OPERATOR_NAV_LINK_LABELS.servicenow,
          icon: Ticket,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: INTEGRATIONS_TEAMS_PATH, // "/integrations/teams"
          label: OPERATOR_NAV_LINK_LABELS.microsoftTeams,
          title: OPERATOR_NAV_LINK_LABELS.microsoftTeams,
          icon: UsersRound,
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
          icon: Webhook,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
      ],
    };
  }
}
