import { HeartPulse, Plug } from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/**
 * Tenant platform operations — connector posture and API health for administrators only (TB-647).
 * Kept out of Insights and Integrations so architect workflows stay outcome-first in the sidebar.
 */
export class OperatePlatformOpsNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-platform-ops",
      label: OPERATOR_NAV_GROUP_LABELS.operations,
      surface: "platform-admin",
      caption: "Connector health and API readiness for workspace administrators.",
      links: [
        {
          // Literal href required for route_tier_policy_nav CI (assert_route_tier_policy_nav.py).
          href: "/integrations/readiness",
          label: OPERATOR_NAV_LINK_LABELS.integrationReadiness,
          title: "Connector health and integration status",
          icon: Plug,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/health",
          label: OPERATOR_NAV_LINK_LABELS.systemHealth,
          title: "System health — API liveness, readiness, and critical dependencies",
          icon: HeartPulse,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
      ],
    };
  }
}
