import {
  Bell,
  FileSearch,
  FileText,
  GitBranch,
  MessageSquare,
  Scale,
  Shield,
  ShieldCheck,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · governance — Read-class hubs vs Execute workflow vs Admin health. */
export class OperateGovernanceNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-governance",
      label: OPERATOR_NAV_GROUP_LABELS.governance,
      surface: "review-workflow",
      caption: "Policy, audit, alerts, and trust controls.",
      links: [
        {
          href: "/alerts",
          label: OPERATOR_NAV_LINK_LABELS.alerts,
          title: this.shortcutTitle("Alerts — inbox, rules, routing, simulation, and tuning", "alt+l"),
          keyShortcut: "alt+l",
          icon: Bell,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/policy-packs",
          label: OPERATOR_NAV_LINK_LABELS.policyPacks,
          title: "Policy packs — versions, effective content, and assignments",
          icon: Shield,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance-resolution",
          label: OPERATOR_NAV_LINK_LABELS.governanceResolution,
          title: "Governance resolution — effective policy for this scope (read view)",
          icon: Scale,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance",
          label: OPERATOR_NAV_LINK_LABELS.governanceWorkflow,
          title: "Governance workflow — approvals, promotions, and environment activation",
          icon: GitBranch,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/audit",
          label: OPERATOR_NAV_LINK_LABELS.auditTrail,
          title: `${OPERATOR_NAV_LINK_LABELS.auditTrail} — search and export scoped audit events`,
          icon: FileSearch,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/first-30-days",
          label: OPERATOR_NAV_LINK_LABELS.first30DaysGovernance,
          title: "First 30 days — minimal governance operating preset after pilot",
          icon: ShieldCheck,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/workspace/security-trust",
          label: OPERATOR_NAV_LINK_LABELS.securityTrust,
          title: "Security & trust — published assessments, CAIQ/SIG, trust-center links",
          icon: ShieldCheck,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/integrations/teams",
          label: OPERATOR_NAV_LINK_LABELS.teamsNotifications,
          title: "Teams notifications — Key Vault reference for incoming webhook fan-out",
          icon: MessageSquare,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/value-report",
          label: OPERATOR_NAV_LINK_LABELS.valueReport,
          title: "Value report — sponsor DOCX from ROI_MODEL-aligned tenant metrics",
          icon: FileText,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
      ],
    };
  }
}
