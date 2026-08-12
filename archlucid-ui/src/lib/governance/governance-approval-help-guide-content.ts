import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  GOVERNANCE_WORKSPACE_HEALTH_HREF,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_APPROVAL_HELP_PAGE_TITLE = "Governance approval";

export const GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE =
  "Learn how architecture work moves from submission to approval, revision, or rejection.";

export const GOVERNANCE_APPROVAL_HELP_OVERVIEW =
  "Governance approval connects a finalized architecture review to an auditable decision. Solution architects submit work for review, governance approvers record decisions, and supporting evidence stays linked for diligence and audit.";

export const GOVERNANCE_APPROVAL_HELP_ACTION_CARD_TITLE = "Record or track an approval";

export const GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS = {
  openWorkflow: {
    label: "Approval queue",
    href: GOVERNANCE_APPROVAL_QUEUE_PATH,
  },
  openDashboard: {
    label: "Workspace health",
    href: GOVERNANCE_WORKSPACE_HEALTH_HREF,
  },
  openFindings: {
    label: "Findings",
    href: "/governance/findings",
  },
} as const;

/** TB-1250 / TB-1387: buyer Governance help must not deep-link eng API contracts. */
export const GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS = {
  label: "Audit trail",
  href: inAppHelpHref("audit-trail"),
} as const;

export const GOVERNANCE_APPROVAL_HELP_WORKFLOW_STEPS = [
  "Prepare architecture review",
  "Resolve required findings",
  "Submit for approval",
  "Review evidence and risk",
  "Approve, reject, or request revision through comments",
  "Record and audit the decision",
] as const;

export const GOVERNANCE_APPROVAL_HELP_DIAGRAM_SUMMARY =
  "Approval requests move from draft preparation through governance review to recorded outcomes. Diagram nodes match the approval-request status table on this page.";

/** Buyer-safe approval state machine — no API paths or eng jargon. */
export const GOVERNANCE_APPROVAL_HELP_DIAGRAM_SOURCE = `stateDiagram-v2
  direction LR
  [*] --> Draft
  Draft --> Submitted: Submit for approval
  Submitted --> Approved: Approve
  Submitted --> Rejected: Reject
  Approved --> Promoted: Release
  Promoted --> Activated: Activate
  Rejected --> Submitted: Revise and resubmit`;

export type GovernanceApprovalHelpRoleId =
  | "solution-architect"
  | "governance-approver"
  | "security-reviewer"
  | "platform-engineer";

export type GovernanceApprovalHelpRoleEntry = {
  readonly id: GovernanceApprovalHelpRoleId;
  readonly title: string;
  readonly description: string;
  readonly tasks: readonly string[];
};

export const GOVERNANCE_APPROVAL_HELP_ROLES: readonly GovernanceApprovalHelpRoleEntry[] = [
  {
    id: "solution-architect",
    title: "Solution architect",
    description:
      "Prepare an architecture review, resolve required findings, and submit it for approval.",
    tasks: [
      "Finalize the review and confirm the signed review record version.",
      "Confirm required fields, environments, and supporting evidence are complete.",
      "Resolve blocking findings or record an accepted disposition before submission.",
      "Submit the approval request with source and target environments.",
      "If a reviewer rejects with comments, revise the review and submit again when ready.",
    ],
  },
  {
    id: "governance-approver",
    title: "Governance approver",
    description: "Review evidence, assess findings, request changes, and record a decision.",
    tasks: [
      "Open pending requests from the governance dashboard or the review workflow.",
      "Inspect findings, policy results, and linked evidence for the review.",
      "Confirm policy requirements and segregation-of-duties rules are satisfied.",
      "Approve or reject the request and add decision rationale in review comments.",
      "After approval, coordinate release to the target environment when your process requires it.",
    ],
  },
  {
    id: "security-reviewer",
    title: "Security or procurement reviewer",
    description: "Access approved assurance materials and review evidence made available for diligence.",
    tasks: [
      "Open the trust center for public and procurement-facing assurance artifacts.",
      "Review evidence attached to approved reviews and recorded governance decisions.",
      "Request additional diligence materials through your organization's security contact.",
      "Understand which artifacts are public, restricted to authenticated users, or under NDA.",
    ],
  },
  {
    id: "platform-engineer",
    title: "Platform engineer",
    description: "Attach CI, deployment, and operational evidence to support governance decisions.",
    tasks: [
      "Attach CI and build evidence to the review before finalize.",
      "Link deployment and environment validation results reviewers can inspect.",
      "Provide operational validation notes when findings reference runtime posture.",
      "Confirm evidence freshness before approvers record a decision.",
    ],
  },
] as const;

export type GovernanceApprovalHelpStatusRow = {
  readonly status: string;
  readonly kind: EnterpriseStatusKind;
  readonly meaning: string;
  readonly whoCanAct: string;
  readonly nextAction: string;
};

/**
 * Approval-request statuses from GovernanceApprovalStatus (API / queue).
 * Do not invent labels here — risk-posture and activation failure copy belong in STATUS_PHASES.
 */
export const GOVERNANCE_APPROVAL_HELP_STATUS_ROWS: readonly GovernanceApprovalHelpStatusRow[] = [
  {
    status: "Draft",
    kind: "draft",
    meaning: "A request is being prepared but has not been sent for governance review.",
    whoCanAct: "Users with submission permission on the review.",
    nextAction: "Complete environments, review record version, and comments, then submit.",
  },
  {
    status: "Submitted",
    kind: "in-progress",
    meaning: "The request is in the governance queue awaiting a reviewer decision.",
    whoCanAct: "Governance approvers with review permission.",
    nextAction: "Open the request, inspect evidence, and approve or reject.",
  },
  {
    status: "Approved",
    kind: "approved",
    meaning: "The approval decision is recorded and visible in the audit trail.",
    whoCanAct: "Governance leads with release permission after approval.",
    nextAction: "Release the signed review record to the target environment when required.",
  },
  {
    status: "Rejected",
    kind: "blocked",
    meaning: "The reviewer declined the request. Rationale remains in the audit trail.",
    whoCanAct: "Submitter or governance lead, per organization policy.",
    nextAction: "Revise the review or open a new request according to current process.",
  },
  {
    status: "Promoted",
    kind: "in-progress",
    meaning: "An approved signed review record was released toward the target environment.",
    whoCanAct: "Governance leads with release permission.",
    nextAction: "Complete activation for the target environment when required.",
  },
  {
    status: "Activated",
    kind: "ready",
    meaning: "The signed review record version is live for the target environment.",
    whoCanAct: "Readers with governance or audit access.",
    nextAction: "Use the audit trail and findings to confirm ongoing posture.",
  },
] as const;

export type GovernanceApprovalHelpStatusPhaseRow = {
  readonly phase: string;
  readonly meaning: string;
};

/** Phases and outcomes operators may describe — not GovernanceApprovalStatus enum values. */
export const GOVERNANCE_APPROVAL_HELP_STATUS_PHASES: readonly GovernanceApprovalHelpStatusPhaseRow[] = [
  {
    phase: "Under review",
    meaning: "A reviewer is actively evaluating evidence while the request remains Submitted.",
  },
  {
    phase: "Changes requested",
    meaning:
      "The product records this outcome as Rejected with reviewer comments. The submitter revises the review and may submit again.",
  },
  {
    phase: "Approved with monitoring",
    meaning:
      "A risk-posture or gate label used elsewhere in the product — not an approval-request status on the queue.",
  },
  {
    phase: "Activation failed",
    meaning:
      "A release or activation step did not complete. The approval request status stays Promoted (or prior) until activation succeeds; remediate and retry.",
  },
  {
    phase: "Superseded",
    meaning:
      "A newer governance release or environment activation replaced an earlier record. Prior approval rows remain in the audit trail.",
  },
] as const;

export const GOVERNANCE_APPROVAL_HELP_PREREQUISITES = [
  "A finalized review exists with a signed review record version.",
  "Required submission fields are complete, including source and target environments.",
  "Blocking findings are resolved, remediated, or explicitly accepted with disposition.",
  "Supporting evidence is attached where your policy requires it.",
  "You have submission permission for the review (Execute rank when enterprise controls apply).",
  "Governance approvers and environment paths are configured for your organization.",
] as const;

export type GovernanceApprovalHelpDecisionOutcome = {
  readonly outcome: string;
  readonly bullets: readonly string[];
};

export const GOVERNANCE_APPROVAL_HELP_DECISION_OUTCOMES: readonly GovernanceApprovalHelpDecisionOutcome[] = [
  {
    outcome: "Approved",
    bullets: [
      "The approval decision is recorded with reviewer identity and timestamp.",
      "The request shows an approved state in the governance workflow and dashboard.",
      "Audit history is updated for procurement and internal assurance.",
      "Authorized users may release the review record to the target environment next.",
    ],
  },
  {
    outcome: "Rejected or revision requested",
    bullets: [
      "The request returns to the submitter with reviewer comments when provided.",
      "Required changes are visible on the approval request history.",
      "Audit history retains the rejection and prior submission trail.",
      "A new submission on the same review stays linked to the decision history.",
    ],
  },
  {
    outcome: "Released and activated",
    bullets: [
      "After approval, a governance release records movement toward the target environment.",
      "Activation confirms which signed review record version is live for that environment.",
      "Older activations may be superseded when a newer release lands.",
      "Audit trail entries capture who released and activated each step.",
    ],
  },
] as const;

export type GovernanceApprovalHelpCommonAction = {
  readonly label: string;
  readonly href: string;
  readonly description: string;
};

export const GOVERNANCE_APPROVAL_HELP_COMMON_ACTIONS: readonly GovernanceApprovalHelpCommonAction[] = [
  {
    label: "Audit",
    description: "Open immutable governance and workflow audit events.",
    href: GOVERNANCE_AUDIT_PATH,
  },
  {
    label: "Reviews",
    description: "Open reviews to attach artifacts before finalize and submission.",
    href: "/architecture/reviews",
  },
  {
    label: "Standards & rules",
    description: "Inspect active policy packs and rules that may block approval.",
    href: GOVERNANCE_STANDARDS_AND_RULES_PATH,
  },
  {
    label: "Trust center",
    description: "Review assurance materials for security and procurement diligence.",
    href: "/trust",
  },
] as const;

export type GovernanceApprovalHelpTroubleshootingItem = {
  readonly issue: string;
  readonly resolution: string;
  readonly href?: string;
  readonly linkLabel?: string;
};

export const GOVERNANCE_APPROVAL_HELP_TROUBLESHOOTING: readonly GovernanceApprovalHelpTroubleshootingItem[] = [
  {
    issue: "Submit for approval is unavailable",
    resolution:
      "Confirm the review is finalized, you have submission permission, and enterprise controls allow mutations for your role.",
  },
  {
    issue: "Approval request not visible",
    resolution:
      "Load the correct review on the governance workflow page or check the dashboard for pending items across reviews.",
  },
  {
    issue: "Evidence appears missing",
    resolution:
      "Return to the review, attach artifacts, re-run policy checks, and reload the workflow for that review.",
  },
  {
    issue: "You lack permission to approve or submit",
    resolution:
      "Ask a governance lead to confirm your role rank and workspace scope. Readers can inspect but not mutate workflow rows.",
  },
  {
    issue: "Policy blocks approval",
    resolution:
      "Open Standards & rules and policy packs to see active rules, then resolve or accept blocking findings.",
  },
  {
    issue: "Request remains pending",
    resolution:
      "Confirm an authorized approver has loaded the review, and check whether segregation-of-duties prevents self-approval.",
  },
  {
    issue: "Stale or superseded request",
    resolution:
      "Compare approval history on the review with the latest governance release and activation rows for the environment.",
  },
  {
    issue: "Audit history not updating",
    resolution:
      "Refresh the governance workflow or audit trail after a decision. If the UI still looks stale, verify the action completed without an error banner.",
  },
] as const;

export const GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_INTRO =
  "Engineering reference for automation, integrations, and support. Customer help above stays product-oriented; expand this section for HTTP contracts and implementation notes.";

export const GOVERNANCE_APPROVAL_HELP_TECHNICAL_REFERENCE_SECTIONS = [
  {
    title: "Approval lifecycle APIs",
    lines: [
      "POST /v1/governance/approval-requests — submit an approval request (optional dryRun=true for validation).",
      "GET /v1/governance/runs/{runId}/approval-requests — list requests for a review.",
      "POST /v1/governance/approval-requests/{id}/approve — record approval from Draft or Submitted.",
      "POST /v1/governance/approval-requests/{id}/reject — record rejection from Draft or Submitted.",
    ],
  },
  {
    title: "Release and activation APIs",
    lines: [
      "POST /v1/governance/promotions — release an approved signed review record toward a target environment.",
      "POST /v1/governance/activations — activate a released record for an environment.",
      "GET /v1/governance/runs/{runId}/promotions and .../activations — review-scoped timeline data.",
    ],
  },
  {
    title: "Dashboard and status values",
    lines: [
      "GET /v1/governance/dashboard — pending approvals (Draft + Submitted) and recent decisions.",
      "Approval status enum: Draft, Submitted, Approved, Rejected, Promoted, Activated.",
      "Browser UI calls route through /api/proxy with JWT when OIDC is enabled.",
    ],
  },
] as const;

export const GOVERNANCE_APPROVAL_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "overview", title: "Overview" },
  { level: 2, id: "governance-workflow", title: "Governance workflow" },
  { level: 2, id: "role-guides", title: "Role guides" },
  { level: 3, id: "solution-architect", title: "Solution architect" },
  { level: 3, id: "governance-approver", title: "Governance approver" },
  { level: 3, id: "security-reviewer", title: "Security or procurement reviewer" },
  { level: 3, id: "platform-engineer", title: "Platform engineer" },
  { level: 2, id: "statuses", title: "Statuses" },
  { level: 2, id: "prerequisites", title: "Prerequisites" },
  { level: 2, id: "decision-outcomes", title: "Decision outcomes" },
  { level: 2, id: "common-actions", title: "Common actions" },
  { level: 2, id: "troubleshooting", title: "Troubleshooting" },
  { level: 2, id: "technical-reference", title: "Technical reference" },
] as const;
