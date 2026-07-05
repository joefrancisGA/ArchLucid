import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CalendarClock,
  Gavel,
  GitBranch,
  History,
  Scale,
  Shield,
  ShieldX,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
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
          // Browsing the approval queue (dashboard, list, lineage, rationale) only needs ReadAuthority — matches
          // GovernanceController's class-level [Authorize(ReadAuthority)] default. Only approve/reject/batch-review/
          // promote/activate are Execute-gated (see canMutateWorkflow in GovernanceWorkflowPageContent, which already
          // ships dedicated reader-mode copy and disables every mutating action for non-Execute callers).
          requiredAuthority: "ReadAuthority",
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
          href: "/governance/policy-packs",
          label: OPERATOR_NAV_LINK_LABELS.policyPacks,
          title: "Manage standards used in reviews",
          icon: Shield,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/resolution",
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
          href: "/governance/audit",
          label: OPERATOR_NAV_LINK_LABELS.auditTrail,
          title: "See who did what and when",
          icon: History,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/alerts",
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
          title: "Recurrence schedules — automated follow-up architecture reviews after finalize",
          icon: CalendarClock,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/first-30-days",
          label: OPERATOR_NAV_LINK_LABELS.governanceSetupGuide,
          title: "Governance setup guide — operating rhythm for approvals, audit, and policy packs",
          icon: CalendarCheck,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
