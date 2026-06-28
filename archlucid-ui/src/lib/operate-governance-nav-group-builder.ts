import {
  AlertTriangle,
  Bell,
  CalendarClock,
  FileSearch,
  Gavel,
  GitBranch,
  Scale,
  Shield,
  ShieldX,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_RESOLUTION_PATH,
} from "@/lib/governance-route-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · governance — workflow, risks, policies, decisions, audit, and alerts. */
export class OperateGovernanceNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-governance",
      label: OPERATOR_NAV_GROUP_LABELS.governance,
      surface: "review-workflow",
      caption: "Approve findings, track risks, policies, decisions, audit, and alerts.",
      links: [
        {
          href: "/governance",
          label: OPERATOR_NAV_LINK_LABELS.governanceWorkflow,
          title: "Approve, defer, waive, or promote findings",
          icon: GitBranch,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/governance/findings",
          label: OPERATOR_NAV_LINK_LABELS.findings,
          title: this.shortcutTitle("Track owned architecture risks", "alt+f"),
          keyShortcut: "alt+f",
          icon: AlertTriangle,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/risk-exceptions",
          label: OPERATOR_NAV_LINK_LABELS.riskExceptions,
          title: "Track active waivers and expirations",
          icon: ShieldX,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: GOVERNANCE_POLICY_PACKS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.policyPacks,
          title: "Manage standards used in reviews",
          icon: Shield,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: GOVERNANCE_RESOLUTION_PATH,
          label: OPERATOR_NAV_LINK_LABELS.governanceResolution,
          title: "Diagnose effective policy, conflicts, and precedence for this scope",
          icon: Scale,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/decision-register",
          label: OPERATOR_NAV_LINK_LABELS.decisionRegister,
          title: "Review signed decisions and dispositions",
          icon: Gavel,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: GOVERNANCE_AUDIT_PATH,
          label: OPERATOR_NAV_LINK_LABELS.auditTrail,
          title: "See who did what and when",
          icon: FileSearch,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: GOVERNANCE_ALERTS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.alerts,
          title: this.shortcutTitle("Review items needing attention", "alt+l"),
          keyShortcut: "alt+l",
          icon: Bell,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/recurrence-schedules",
          label: OPERATOR_NAV_LINK_LABELS.recurrenceSchedules,
          title: "Recurrence schedules — automated follow-up architecture reviews after commit",
          icon: CalendarClock,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
