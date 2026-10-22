import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import { CLOUD_CONNECTIONS_CANONICAL_PATH } from "@/lib/cloud-connections-evidence-copy";
import {
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import { SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import type {
  TroubleshootingDecisionStep,
  TroubleshootingIssue,
  TroubleshootingLink,
} from "@/lib/troubleshooting-help-guide-content";

const SECURENOW_REPORT_PROBLEM_LINK: TroubleshootingLink = {
  label: "Report a problem",
  href: inAppHelpHref("report-a-problem"),
};

function supportEscalationLinks(
  ...additional: readonly TroubleshootingLink[]
): readonly TroubleshootingLink[] {
  return [SECURENOW_REPORT_PROBLEM_LINK, ...additional];
}

export const SECURENOW_TROUBLESHOOTING_BEFORE_CONTACT_ITEMS = [
  "Report reference id (from Report problem on error pages)",
  "Workspace name",
  "Finding ID or resource path if visible",
  "Approximate time of issue",
  "Screenshot of the error, if possible",
  "Support bundle (download below)",
  "What action failed",
  "Error message shown on screen, if any",
  "Whether the issue still happens after refresh",
] as const;

export const SECURENOW_TROUBLESHOOTING_DECISION_TREE_STEPS: readonly TroubleshootingDecisionStep[] = [
  {
    id: "decision-sign-in",
    question: "Can you sign in?",
    branches: [
      {
        label: "No",
        href: inAppHelpHref("authentication-sign-in"),
        linkLabel: "Open authentication and sign-in help",
      },
      { label: "Yes", href: "#decision-workspace", linkLabel: "Continue to workspace check" },
    ],
  },
  {
    id: "decision-workspace",
    question: "Are you in the expected workspace?",
    branches: [
      {
        label: "No",
        href: inAppHelpHref("users-and-roles"),
        linkLabel: "Open users and roles / contact workspace admin",
      },
      { label: "Yes", href: "#decision-inventory", linkLabel: "Continue to inventory check" },
    ],
  },
  {
    id: "decision-inventory",
    question: "Is Azure connected or inventory uploaded?",
    branches: [
      {
        label: "No — connect Azure",
        href: inAppHelpHref("cloud-connections"),
        linkLabel: "Open Azure connections help",
      },
      {
        label: "No — upload ZIP",
        href: SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
        linkLabel: "Open extract and upload",
      },
      { label: "Yes", href: "#decision-packs-assigned", linkLabel: "Continue to policy packs check" },
    ],
  },
  {
    id: "decision-packs-assigned",
    question: "Are ARC-AMPE policy packs assigned?",
    branches: [
      { label: "No", href: SECURENOW_POLICY_PACKS_PATH, linkLabel: "Open policy packs" },
      { label: "Yes", href: "#decision-findings-exports", linkLabel: "Continue to findings and exports check" },
    ],
  },
  {
    id: "decision-findings-exports",
    question: "Are findings or exports missing?",
    branches: [
      { label: "Findings missing", href: SECURENOW_FINDINGS_PATH, linkLabel: "Open findings queue" },
      {
        label: "Exports missing",
        href: SECURENOW_AUDIT_EVIDENCE_PATH,
        linkLabel: "Open audit evidence lineage",
      },
      {
        label: "Permissions missing",
        href: inAppHelpHref("users-and-roles"),
        linkLabel: "Open users and roles",
      },
    ],
  },
  {
    id: "decision-still-blocked",
    question: "Still blocked?",
    branches: [
      { label: "Download support bundle", href: "#before-contacting-support", linkLabel: "Before contacting support" },
      {
        label: "Report a problem",
        href: inAppHelpHref("report-a-problem"),
        linkLabel: "Report a problem help",
      },
      { label: "Contact support", href: `mailto:${ARCHLUCID_SUPPORT_EMAIL}`, linkLabel: "Email support" },
    ],
  },
] as const;

/** SecureNow-only common issues — merged after shared sign-in and permissions cards. */
export const SECURENOW_TROUBLESHOOTING_ADDITIONAL_ISSUES: readonly TroubleshootingIssue[] = [
  {
    id: "azure-connector-unhealthy",
    title: "Azure connector shows unhealthy or disconnected",
    kind: "workspace-admin",
    whatYouSee: "Cloud connections reports a failed health check or the connector stays disconnected.",
    likelyCause: "Expired credentials, missing read permissions, or a temporary Azure API outage.",
    tryFirst: "Open Azure connections, confirm the subscription scope, then retry the health check.",
    ifStillBlocked: "Ask your workspace admin to re-authorize the connector or upload a validated inventory ZIP instead.",
    nextSteps: [
      { label: "Open Azure connections", href: CLOUD_CONNECTIONS_CANONICAL_PATH },
      { label: "Azure connections help", href: inAppHelpHref("cloud-connections") },
      ...supportEscalationLinks(),
    ],
  },
  {
    id: "policy-pack-scan-pending",
    title: "Policy pack scan has not produced findings",
    kind: "user-fixable",
    whatYouSee: "Policy packs are assigned but the findings queue stays empty after inventory is connected.",
    likelyCause: "Scan still running, priority floors exclude resources, or inventory evidence is not indexed yet.",
    tryFirst: "Open policy packs and confirm ARC-AMPE packs are assigned for this workspace scope.",
    ifStillBlocked: "Open resource explorer to confirm inventory rows exist, then retry after a refresh.",
    nextSteps: [
      { label: "Open policy packs", href: SECURENOW_POLICY_PACKS_PATH },
      { label: "Open findings queue", href: SECURENOW_FINDINGS_PATH },
      { label: "Open extract and upload", href: SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH },
    ],
  },
] as const;
