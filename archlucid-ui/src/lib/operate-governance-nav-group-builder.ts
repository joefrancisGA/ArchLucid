import {
  AlertCircle,
  Bell,
  FileSearch,
  FileText,
  GitBranch,
  Scale,
  Shield,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · governance — findings, exceptions, policies, decisions, audit, and alerts. */
export class OperateGovernanceNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-governance",
      label: OPERATOR_NAV_GROUP_LABELS.governance,
      surface: "review-workflow",
      caption: "Findings, exceptions, policies, decisions, audit, and alerts.",
      links: [
        {
          href: "/governance/findings",
          label: OPERATOR_NAV_LINK_LABELS.findings,
          title: this.shortcutTitle(
            "Risk register — owned architecture risks, dispositions, review cadence, and linked manifest decisions",
            "alt+f",
          ),
          keyShortcut: "alt+f",
          icon: AlertCircle,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/risk-exceptions",
          label: OPERATOR_NAV_LINK_LABELS.riskExceptions,
          title: "Risk exceptions — active waivers, renewals, and revocations",
          icon: AlertCircle,
          tier: "extended",
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
          href: "/governance/decision-register",
          label: OPERATOR_NAV_LINK_LABELS.decisionRegister,
          title: "Decision register — architecture decisions with confidence and buyer attestation",
          icon: FileText,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/alerts",
          label: OPERATOR_NAV_LINK_LABELS.alerts,
          title: this.shortcutTitle("Alerts — inbox, rules, routing, simulation, and tuning", "alt+l"),
          keyShortcut: "alt+l",
          icon: Bell,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
