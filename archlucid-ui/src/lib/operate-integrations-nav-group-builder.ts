import { MessageSquare, Plug, Webhook } from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · integrations — connectors, cloud ingestion, and outbound notifications. */
export class OperateIntegrationsNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-integrations",
      label: OPERATOR_NAV_GROUP_LABELS.integrations,
      surface: "review-workflow",
      caption: "Connect evidence sources and send events to external systems.",
      links: [
        {
          href: "/integrations/operations",
          label: OPERATOR_NAV_LINK_LABELS.connectorOperations,
          title: "Check readiness for optional integrations",
          icon: Plug,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/settings/cloud-connections",
          label: OPERATOR_NAV_LINK_LABELS.cloudConnections,
          title: "Connect Azure for production evidence",
          icon: Webhook,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/integrations/webhooks",
          label: OPERATOR_NAV_LINK_LABELS.webhookSubscriptions,
          title: "Send events to external HTTPS endpoints",
          icon: Webhook,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/integrations/teams",
          label: OPERATOR_NAV_LINK_LABELS.teamsNotifications,
          title: "Send alerts to Teams",
          icon: MessageSquare,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
