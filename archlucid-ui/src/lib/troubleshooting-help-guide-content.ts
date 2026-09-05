import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING,
  TROUBLESHOOTING_HELP_CLAIM_HEADING_ID,
} from "@/lib/troubleshooting-help-evidence-copy";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_HREF,
  ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_LINK_LABEL,
  ADMIN_DIAGNOSTICS_INBOUND_SECTION_TITLE,
} from "@/lib/admin-diagnostics-inbound-copy";

export const TROUBLESHOOTING_REPORT_PROBLEM_LINK = {
  label: "Report a problem",
  href: inAppHelpHref("report-a-problem"),
} as const;

export const TROUBLESHOOTING_EMAIL_SUPPORT_LINK = {
  label: "Email support",
  href: `mailto:${ARCHLUCID_SUPPORT_EMAIL}`,
} as const;

function supportEscalationLinks(
  ...additional: readonly TroubleshootingLink[]
): readonly TroubleshootingLink[] {
  return [TROUBLESHOOTING_REPORT_PROBLEM_LINK, TROUBLESHOOTING_EMAIL_SUPPORT_LINK, ...additional];
}

export const TROUBLESHOOTING_HELP_SUBTITLE =
  "Find common issues, try the first fix, and collect support details when needed.";

export const TROUBLESHOOTING_HELP_PAGE_TITLE = "Troubleshooting" as const;

export const TROUBLESHOOTING_HELP_OVERVIEW = TROUBLESHOOTING_HELP_SUBTITLE;

export const TROUBLESHOOTING_HELP_START_HERE_CARD_TITLE = "Start here" as const;

export const TROUBLESHOOTING_HELP_PRIMARY_ACTION = {
  href: ADMINISTRATION_SYSTEM_HEALTH_PATH,
  label: "Open System health",
  testId: "help-troubleshooting-open-system-health",
} as const;

export type TroubleshootingIssueKind =
  | "user-fixable"
  | "workspace-admin"
  | "archlucid-support"
  | "internal-operator";

export type TroubleshootingLink = {
  readonly label: string;
  readonly href: string;
};

export type TroubleshootingIssue = {
  readonly id: string;
  readonly title: string;
  readonly kind: TroubleshootingIssueKind;
  readonly whatYouSee: string;
  readonly likelyCause: string;
  readonly tryFirst: string;
  readonly ifStillBlocked: string;
  readonly nextSteps: readonly TroubleshootingLink[];
};

export const TROUBLESHOOTING_ISSUE_KIND_LABELS: Readonly<Record<TroubleshootingIssueKind, string>> = {
  "user-fixable": "You can try this",
  "workspace-admin": "Workspace admin",
  "archlucid-support": "Contact support",
  "internal-operator": "Platform / support",
};

export const TROUBLESHOOTING_START_HERE_ITEMS = [
  "Refresh the page",
  "Confirm you are in the correct workspace",
  "Check whether the review is finalized",
  "Open System health if loading or readiness looks wrong",
  "Download a support bundle before contacting support",
] as const;

export const TROUBLESHOOTING_PRIMARY_ACTIONS = {
  systemHealth: { href: ADMINISTRATION_SYSTEM_HEALTH_PATH, label: "Open System health" },
  reportProblem: TROUBLESHOOTING_REPORT_PROBLEM_LINK,
  contactSupport: TROUBLESHOOTING_EMAIL_SUPPORT_LINK,
} as const;

/** Access / sign-in blockers lead so time-pressured triage finds them first. */
export const TROUBLESHOOTING_COMMON_ISSUES: readonly TroubleshootingIssue[] = [
  {
    id: "organization-sso-required",
    title: "Organization sign-in required",
    kind: "user-fixable",
    whatYouSee: "ArchLucid asks you to continue through your organization's identity provider instead of email code.",
    likelyCause: "Your email domain has tenant-enforced SSO for ArchLucid access.",
    tryFirst: "Select Continue to organization sign-in and authenticate with your company identity provider.",
    ifStillBlocked: "Contact your workspace administrator or IT team if you cannot reach your organization's sign-in page.",
    nextSteps: [
      { label: "Authentication and sign-in", href: inAppHelpHref("authentication-sign-in") },
      { label: "Enterprise onboarding checklist", href: inAppHelpHref("enterprise-onboarding") },
      ...supportEscalationLinks(),
    ],
  },
  {
    id: "email-code-sign-in-failed",
    title: "Email one-time code did not work",
    kind: "user-fixable",
    whatYouSee: "The sign-in code is rejected, expired, or never arrives.",
    likelyCause: "Typo, expired code, rate limiting, or mail delivery delay.",
    tryFirst: "Request a new code, check spam or junk folders, and confirm the email address is correct.",
    ifStillBlocked: "Wait a few minutes if you see too many attempts, then try again or use a work or school account.",
    nextSteps: [
      { label: "Authentication and sign-in", href: inAppHelpHref("authentication-sign-in") },
      { label: "Sign in", href: "/auth/signin" },
      ...supportEscalationLinks(),
    ],
  },
  {
    id: "permissions-or-sign-in-issue",
    title: "Permissions or sign-in issue",
    kind: "workspace-admin",
    whatYouSee: "Actions are missing, or you see access denied style errors.",
    likelyCause: "Role, sign-in session, or workspace scope does not match the action.",
    tryFirst: "Sign out and back in. Confirm your role in workspace settings.",
    ifStillBlocked: "Ask your workspace admin or IT team to verify identity and role assignment.",
    nextSteps: [
      { label: "Authentication and sign-in", href: inAppHelpHref("authentication-sign-in") },
      { label: "Open users and roles", href: inAppHelpHref("users-and-roles") },
      { label: "Open workspace settings", href: "/administration/workspace-settings" },
      ...supportEscalationLinks(),
    ],
  },
  {
    id: "overview-workspace-empty",
    title: "Home or workspace readiness looks empty",
    kind: "user-fixable",
    whatYouSee: "Workspace readiness does not load, or the section stays blank for a long time.",
    likelyCause: "Temporary service delay, sample workspace not loaded, or wrong workspace selected.",
    tryFirst: "Refresh the page and confirm you are in the intended workspace.",
    ifStillBlocked: "Open System health. If readiness stays red, download a support bundle and contact support.",
    nextSteps: [
      { label: "Open System health", href: ADMINISTRATION_SYSTEM_HEALTH_PATH },
      { label: "Open reviews", href: "/architecture/reviews" },
      ...supportEscalationLinks(),
    ],
  },
  {
    id: "sample-review-missing",
    title: "Sample review is missing",
    kind: "user-fixable",
    whatYouSee: "No sample review appears on Home or the reviews list.",
    likelyCause: "Sample workspace setup is incomplete or you are scoped to a different workspace.",
    tryFirst: "Refresh Home and confirm the workspace switcher shows the workspace you expect.",
    ifStillBlocked: "Start a new review or ask your workspace admin to confirm sample data is available.",
    nextSteps: [
      { label: "Getting started", href: inAppHelpHref("getting-started") },
      { label: "View first review guide", href: inAppHelpHref("first-architecture-review") },
      { label: "Start architecture review", href: "/architecture/reviews/new" },
    ],
  },
  {
    id: "review-package-does-not-open",
    title: "Review does not open",
    kind: "user-fixable",
    whatYouSee: "Selecting a review shows an error or endless loading.",
    likelyCause: "Wrong review selected, workspace scope mismatch, or a temporary service error.",
    tryFirst: "Refresh the page and open the review again. Note the on-screen error message.",
    ifStillBlocked: "Use the decision tree below, then download a support bundle if the issue repeats after refresh.",
    nextSteps: [
      { label: "Open reviews", href: "/architecture/reviews" },
      { label: "Open System health", href: ADMINISTRATION_SYSTEM_HEALTH_PATH },
      { label: "Decision tree", href: "#decision-tree" },
    ],
  },
  {
    id: "findings-count-wrong",
    title: "Findings count looks wrong",
    kind: "user-fixable",
    whatYouSee: "Findings on Home or inside the review do not match expectations.",
    likelyCause: "Filters applied, stale list, or the review is still in progress.",
    tryFirst: "Open the review and confirm review status is complete.",
    ifStillBlocked: "Compare findings with the Evidence graph and review summary.",
    nextSteps: [
      { label: "Open reviews", href: "/architecture/reviews" },
      { label: "Open Evidence graph guide", href: inAppHelpHref("evidence-trail") },
      { label: "Open findings queue", href: "/governance/findings" },
    ],
  },
  {
    id: "export-download-unavailable",
    title: "Export or deliverable download is unavailable",
    kind: "user-fixable",
    whatYouSee: "Export is disabled or the download fails.",
    likelyCause: "Review not finalized, missing finalized review record, or your role cannot export.",
    tryFirst: "Confirm the review is finalized and you have export permission.",
    ifStillBlocked: "Review governance approval requirements and retry after refresh.",
    nextSteps: [
      { label: "Open governance approval", href: inAppHelpHref("governance-approval") },
      { label: "Open reviews", href: "/architecture/reviews" },
      { label: "Open users and roles", href: inAppHelpHref("users-and-roles") },
    ],
  },
  {
    id: "governance-pre-commit-blocked",
    title: "Finalize blocked by policy",
    kind: "workspace-admin",
    whatYouSee: "Finalize returns a policy block with severity or policy pack details.",
    likelyCause: "Findings exceed the configured finalize threshold for the active policy pack.",
    tryFirst: "Review blocking findings, remediate or accept risk per policy, then retry finalize.",
    ifStillBlocked: "Ask a workspace admin to adjust policy thresholds if the block is not appropriate.",
    nextSteps: [
      { label: "Open governance approval", href: inAppHelpHref("governance-approval") },
      { label: "Open policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
      ...supportEscalationLinks(),
    ],
  },
  {
    id: "ask-compare-unavailable",
    title: "Ask or compare is unavailable",
    kind: "user-fixable",
    whatYouSee: "Ask, compare, or related analysis surfaces are greyed out.",
    likelyCause: "Feature gated until the first review is finalized or trial limits apply.",
    tryFirst: "Finalize your first review, then refresh the page.",
    ifStillBlocked: "Check trial banners on Home for budget or entitlement limits.",
    nextSteps: [
      { label: "View first review guide", href: inAppHelpHref("first-architecture-review") },
      { label: "Open reviews", href: "/architecture/reviews" },
      ...supportEscalationLinks(),
    ],
  },
  {
    id: "evidence-upload-failed",
    title: "Evidence upload failed",
    kind: "user-fixable",
    whatYouSee: "Upload fails on a new review or from an evidence ZIP.",
    likelyCause: "Unsupported file type, size limit, or validation issue in the evidence bundle.",
    tryFirst: "Read the inline error, confirm file type and size, then retry the upload.",
    ifStillBlocked: "Try a smaller file or a different evidence format before contacting support.",
    nextSteps: [
      { label: "Open evidence upload guide", href: inAppHelpHref("evidence-intake") },
      { label: "Start architecture review", href: "/architecture/reviews/new" },
      ...supportEscalationLinks(),
    ],
  },
] as const;

export type TroubleshootingDecisionBranch = {
  readonly label: string;
  readonly href: string;
  readonly linkLabel: string;
};

export type TroubleshootingDecisionStep = {
  readonly id: string;
  readonly question: string;
  readonly branches: readonly TroubleshootingDecisionBranch[];
};

export const TROUBLESHOOTING_DECISION_TREE_STEPS: readonly TroubleshootingDecisionStep[] = [
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
      { label: "Yes", href: "#decision-review-visible", linkLabel: "Continue to reviews" },
    ],
  },
  {
    id: "decision-review-visible",
    question: "Is a review visible?",
    branches: [
      { label: "No", href: "/architecture/reviews", linkLabel: "Open reviews" },
      { label: "No — need a sample", href: inAppHelpHref("getting-started"), linkLabel: "Load sample workspace / getting started" },
      { label: "No — start fresh", href: "/architecture/reviews/new", linkLabel: "Start architecture review" },
      { label: "Yes", href: "#decision-finalized", linkLabel: "Continue to finalize check" },
    ],
  },
  {
    id: "decision-finalized",
    question: "Is the architecture review finalized?",
    branches: [
      { label: "No", href: "/architecture/reviews", linkLabel: "Open review detail and finalize review" },
      { label: "Yes", href: "#decision-outputs", linkLabel: "Continue to outputs check" },
    ],
  },
  {
    id: "decision-outputs",
    question: "Are findings, evidence, or report outputs missing?",
    branches: [
      { label: "Findings missing", href: inAppHelpHref("evidence-trail"), linkLabel: "Open Evidence graph" },
      { label: "Reports missing", href: SPONSOR_REPORT_PATH, linkLabel: "Open value report" },
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

export const TROUBLESHOOTING_BEFORE_CONTACT_ITEMS = [
  "Report reference id (from Report problem on error pages)",
  "Workspace name",
  "Review name or ID if visible",
  "Approximate time of issue",
  "Screenshot of the error, if possible",
  "Support bundle (download below)",
  "What action failed",
  "Error message shown on screen, if any",
  "Whether the issue still happens after refresh",
] as const;

export type TroubleshootingAdvancedDiagnosticItem = {
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly linkLabel: string;
  readonly adminOnly?: boolean;
};

export const TROUBLESHOOTING_ADVANCED_DIAGNOSTICS_ITEMS: readonly TroubleshootingAdvancedDiagnosticItem[] = [
  {
    title: "Service readiness",
    body: "Open System health for live and ready checks. Workspace administrators can review dependency status before escalating.",
    href: ADMINISTRATION_SYSTEM_HEALTH_PATH,
    linkLabel: "Open System health",
  },
  {
    title: ADMIN_DIAGNOSTICS_INBOUND_SECTION_TITLE,
    body: "Workspace admins can review readiness signals, assistant diagnostics, and platform health references in Help.",
    href: ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_HREF,
    linkLabel: ADMIN_DIAGNOSTICS_INBOUND_GUIDANCE_LINK_LABEL,
  },
  {
    title: "Support reference for tickets",
    // TB-1249: stay on customer paths — never deep-link the eng troubleshooting runbook.
    body: "When support asks for a support reference, copy the request ID shown on the error panel, then open Report a problem. Do not share secrets or evidence contents.",
    href: inAppHelpHref("report-a-problem"),
    linkLabel: "Report a problem",
  },
] as const;


export const TROUBLESHOOTING_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "start-here", title: "Start here" },
  { level: 2, id: "common-issues", title: "Common issues" },
  { level: 2, id: "decision-tree", title: "Decision tree" },
  { level: 2, id: "before-contacting-support", title: "Before contacting support" },
  { level: 2, id: "advanced-diagnostics", title: "Advanced diagnostics" },
  { level: 2, id: TROUBLESHOOTING_HELP_CLAIM_HEADING_ID, title: TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
