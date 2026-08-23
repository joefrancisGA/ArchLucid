import {
  AlertTriangle,
  Bell,
  ClipboardList,
  FileText,
  Gavel,
  GitBranch,
  History,
  Lightbulb,
  ShieldX,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
} from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

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
          href: "/governance/decision-register",
          label: OPERATOR_NAV_LINK_LABELS.decisionRegister,
          title: "Review recorded decisions and resolve outcomes",
          icon: Gavel,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: SIGNED_RECORDS_LIST_PATH,
          label: OPERATOR_NAV_LINK_LABELS.sealedReviewRecords,
          title: "Browse finalized review records across reviews",
          icon: FileText,
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
