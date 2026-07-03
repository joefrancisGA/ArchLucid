import { CalendarClock, CloudCog, Hash, Plug, Ticket, UsersRound, Webhook, Workflow } from "lucide-react";
import type { NavGroupConfig } from "@/lib/nav-config.types";
import {
  INTEGRATIONS_JIRA_PATH,
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
          // Literal href required for route_tier_policy_nav CI (assert_route_tier_policy_nav.py).
          href: "/integrations/readiness",
          label: OPERATOR_NAV_LINK_LABELS.integrationReadiness,
          title: "Connector health and integration status",
          icon: Plug,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
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
        {
          href: "/governance/recurrence-schedules",
          label: OPERATOR_NAV_LINK_LABELS.recurrenceSchedules,
          title: "Recurrence schedules — automated follow-up architecture reviews after finalize",
          icon: CalendarClock,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
