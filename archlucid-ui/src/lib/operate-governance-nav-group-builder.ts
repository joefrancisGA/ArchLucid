import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  ClipboardList,
  Gavel,
  GitBranch,
  History,
  Inbox,
  Layers,
  Lightbulb,
  ShieldX,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
  GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH,
} from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_ENVIRONMENTS_PATH } from "@/lib/governance/governance-environments-route";
import { GOVERNANCE_SETUP_HREF } from "@/lib/governance/governance-setup-route";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · approval — decide, track, and audit the approval loop. */
export class OperateGovernanceNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-governance",
      label: OPERATOR_NAV_GROUP_LABELS.governance,
      surface: "review-workflow",
      caption: "Approve findings, track exceptions and decisions, and monitor audit trail and alerts.",
      links: [
        {
          href: "/governance/needs-attention" as typeof GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH,
          label: OPERATOR_NAV_LINK_LABELS.needsAttentionInbox,
          title: "Single inbox for unfinished work, assigned findings, alerts, and approvals",
          icon: Inbox,
          tier: "essential",
          requiredAuthority: "ReadAuthority",
        },
        {
          // String literal required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
          href: "/governance/approval-queue" as typeof GOVERNANCE_APPROVAL_QUEUE_PATH,
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
          href: GOVERNANCE_SETUP_HREF,
          label: OPERATOR_NAV_LINK_LABELS.governanceSetupGuide,
          title: "Approval setup — operating rhythm for approvals, audit, and policy packs",
          icon: CalendarCheck,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: GOVERNANCE_ENVIRONMENTS_PATH as typeof GOVERNANCE_ENVIRONMENTS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.governanceEnvironments,
          title: "Define approval environment slots and allowed transitions",
          icon: Layers,
          tier: "extended",
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
          href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH as typeof GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.assignedToMeFindings,
          title: "Open findings assigned to you for remediation",
          icon: ClipboardList,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          // String literal required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.
          href: "/governance/exceptions" as typeof GOVERNANCE_EXCEPTIONS_PATH,
          label: OPERATOR_NAV_LINK_LABELS.riskExceptions,
          title: "Track active waivers and expirations",
          icon: ShieldX,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/remediation-factory",
          label: OPERATOR_NAV_LINK_LABELS.remediationFactory,
          title: "Explainable remediation prioritization, waves, and executive metrics",
          icon: Layers,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/remediation-patterns",
          label: OPERATOR_NAV_LINK_LABELS.remediationPatterns,
          title: "Create, review, approve, and import remediation patterns (Draft-only import)",
          icon: ClipboardList,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/decision-register",
          label: OPERATOR_NAV_LINK_LABELS.decisionRegister,
          title: "Review recorded decisions and governance approval",
          icon: Gavel,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/governance/advisory-scans",
          label: OPERATOR_NAV_LINK_LABELS.architectureAdvisory,
          title: "Generate prioritized follow-up recommendations from finalized reviews",
          icon: Lightbulb,
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
      ],
    };
  }
}
