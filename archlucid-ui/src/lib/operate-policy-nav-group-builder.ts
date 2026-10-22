import {
  CalendarClock,
  Scale,
  Shield,
  SlidersHorizontal,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · policy — packs, standards, alert rules, and schedules. */
export class OperatePolicyNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-policy",
      label: OPERATOR_NAV_GROUP_LABELS.policy,
      surface: "review-workflow",
      caption: "Configure policy packs, standards, alert rules, and recurrence schedules.",
      links: [
        {
          href: "/governance/policy-packs",
          label: OPERATOR_NAV_LINK_LABELS.policyPacks,
          title: "Manage standards used in reviews",
          icon: Shield,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          // String literal required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
          href: GOVERNANCE_STANDARDS_AND_RULES_PATH as typeof GOVERNANCE_STANDARDS_AND_RULES_PATH & "/governance/standards-and-rules",
          label: OPERATOR_NAV_LINK_LABELS.governanceResolution,
          title: "Diagnose effective policy, conflicts, and precedence for this scope",
          icon: Scale,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/alert-rules",
          label: OPERATOR_NAV_LINK_LABELS.alertRules,
          title: "Configure alert conditions and notification delivery",
          icon: SlidersHorizontal,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
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
