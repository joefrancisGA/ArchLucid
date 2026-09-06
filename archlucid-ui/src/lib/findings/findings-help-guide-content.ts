import { FINDINGS_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/findings/findings-help-evidence-copy";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  GOVERNANCE_RESOLUTION_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import { SEVERITY_LABELS } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const FINDINGS_HELP_PAGE_TITLE = "Findings";

export const FINDINGS_HELP_PAGE_SUBTITLE =
  "Understand architecture risks, inspect supporting evidence, and decide how each finding should be addressed.";

export const FINDINGS_HELP_OVERVIEW =
  "A finding is an evidence-backed architecture concern identified during a review. Findings describe the observed issue, its severity, the affected area, supporting evidence, and recommended action. Depending on your role, you may investigate, assign, remediate, accept, waive, or escalate a finding.";

export const FINDINGS_HELP_PRIMARY_ACTIONS = {
  openFindings: {
    label: "Open findings",
    href: "/governance/findings",
  },
  searchEvidence: {
    label: "Search review evidence",
    href: "/insights/search-review-evidence",
  },
  governanceDecisions: {
    label: "View approval",
    href: "/governance/decision-register",
  },
} as const;

/** Policy packs link for related governance context — not shown as a raw path in copy. */
export const FINDINGS_HELP_POLICY_PACKS_LINK = {
  label: "Open policy packs",
  href: GOVERNANCE_POLICY_PACKS_PATH,
} as const;

/** TB-1250 / TB-1387: buyer Findings help must not deep-link eng API contracts. */
export const FINDINGS_HELP_RELATED_PRODUCT_DOCS = {
  label: "Audit trail",
  href: inAppHelpHref("audit-trail"),
} as const;

export const FINDINGS_HELP_READINESS_SECTION_TITLE = "Workspace finding summary";

export const FINDINGS_HELP_READINESS_FORBIDDEN_MESSAGE =
  "Live finding status needs a role that can view the findings queue.";

export const FINDINGS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL = "This workspace";

export const FINDINGS_HELP_READINESS_LABELS = {
  openFindings: "Open findings",
  criticalAndError: `${SEVERITY_LABELS.critical} and ${SEVERITY_LABELS.error.toLowerCase()} findings`,
  awaitingDecision: "Findings awaiting decision",
  recentlyResolved: "Findings remediated (30 days)",
} as const;

export type FindingsHelpAnatomyField = {
  readonly label: string;
  readonly description: string;
};

export const FINDINGS_HELP_ANATOMY_FIELDS: readonly FindingsHelpAnatomyField[] = [
  { label: "Title", description: "Short statement of the architecture concern." },
  { label: "Severity", description: "How urgent or material the risk is for the review." },
  { label: "Status", description: "Whether the finding is open, under review, or closed." },
  { label: "Affected domain", description: "The architecture area, system, or resource involved." },
  { label: "Business impact", description: "Why the issue matters for delivery, compliance, or operations." },
  { label: "Evidence", description: "Inputs, diagrams, or policy checks that support the finding." },
  { label: "Recommendation", description: "Suggested remediation, monitoring, or next step." },
  { label: "Owner", description: "The person accountable for follow-up when assigned." },
  { label: "Resolve outcome", description: "Recorded acceptance, waiver, remediation, or exception." },
] as const;

export type FindingsHelpSeverityRow = {
  readonly level: string;
  readonly description: string;
};

/** Customer-facing severity guidance aligned with normalizeFindingSeverity output labels. */
export const FINDINGS_HELP_SEVERITY_ROWS: readonly FindingsHelpSeverityRow[] = [
  {
    level: SEVERITY_LABELS.critical,
    description: "Immediate or material risk that may block approval or require urgent action.",
  },
  {
    level: SEVERITY_LABELS.error,
    description: "Significant risk that should be addressed before implementation or release.",
  },
  {
    level: SEVERITY_LABELS.warning,
    description: "Meaningful concern that requires mitigation, monitoring, or an explicit decision.",
  },
  {
    level: SEVERITY_LABELS.info,
    description: "Limited risk or an improvement opportunity that should be tracked.",
  },
  {
    level: SEVERITY_LABELS.high,
    description: "Elevated risk that should be prioritized before lower-severity items.",
  },
  {
    level: SEVERITY_LABELS.medium,
    description: "Moderate concern that should be tracked with owners and follow-up dates.",
  },
  {
    level: SEVERITY_LABELS.low,
    description: "Lower-priority improvement or hygiene item that should still be recorded.",
  },
  {
    level: SEVERITY_LABELS.unknown,
    description: "Severity was missing or could not be classified — triage before disposition.",
  },
] as const;

export const FINDINGS_HELP_PROVENANCE_TITLE = "Where findings come from";

export const FINDINGS_HELP_PROVENANCE_INTRO =
  "Every finding is labeled by origin so you know what you are signing off on. Deterministic-rule findings come from policy pack rules. Deterministic-fallback findings appear when the live model path failed and a fallback path produced the row — verify independently. AI-generated findings come from a language model and carry a grounding label. Simulated findings come from the deterministic simulator and should not be cited as live-model evidence.";

export const FINDINGS_HELP_PROVENANCE_AXES = [
  {
    axis: "Origin",
    answers: "Who produced the finding?",
    values: "Deterministic rule · Deterministic fallback · AI-generated · Simulated",
  },
  {
    axis: "Grounding",
    answers: "How well is the conclusion supported?",
    values: "Evidence-backed · Estimated · Ungrounded · Degraded · Not applicable (for rule/simulator origins)",
  },
] as const;

export const FINDINGS_HELP_PROVENANCE_ORIGINS = [
  {
    origin: "Deterministic rule",
    description:
      "A policy rule fired; the rationale comes from the rule definition, not a model.",
  },
  {
    origin: "Deterministic fallback",
    description:
      "The live model path failed; this finding uses a deterministic fallback — verify independently before sign-off.",
  },
  {
    origin: "AI-generated",
    description:
      "A language model produced the finding. Grounding may be evidence-backed, estimated, ungrounded, or degraded.",
  },
  {
    origin: "Simulated",
    description:
      "Produced by the deterministic simulator, not a live model — structurally valid but not real-model evidence.",
  },
] as const;

export const FINDINGS_HELP_PROVENANCE_NON_CLAIM =
  "Provenance labeling describes how a finding was produced and whether evidence is attached. It does not claim accuracy rates, production validation, or that AI-generated findings are independently verified. Reviewers remain accountable for disposition decisions.";

export const FINDINGS_HELP_EVIDENCE_INTRO =
  "Evidence explains why a finding exists. From a finding, authorized users can review the supporting material and trace how it connects to architecture elements and policy rules.";

export const FINDINGS_HELP_EVIDENCE_ITEMS = [
  "Source evidence such as diagrams, documents, or cloud inventory",
  "The requirement or rule being evaluated",
  "Reasoning that connects the evidence to the finding",
  "Affected architecture elements",
  "Confidence or evidence quality when shown",
  "Related findings and recorded decisions",
] as const;

export const FINDINGS_HELP_EVIDENCE_ACTIONS = [
  {
    label: FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.label,
    description: "Open the finding from the risk register or review and inspect linked evidence.",
    href: FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.href,
  },
  {
    label: "Browse standards and rules",
    description: "See the policy or standard that produced the finding.",
    href: GOVERNANCE_RESOLUTION_PATH,
  },
  {
    label: "Open evidence graph",
    description: "Explore provenance and relationships across the review.",
    href: "/insights/evidence-graph",
  },
  {
    label: FINDINGS_HELP_POLICY_PACKS_LINK.label,
    description: "Review enabled policy packs that scope standards and rules for reviews.",
    href: FINDINGS_HELP_POLICY_PACKS_LINK.href,
  },
] as const;

export type FindingsHelpLifecycleStage = {
  readonly status: string;
  readonly meaning: string;
};

/** Lifecycle stages use product disposition and review terminology in customer language. */
export const FINDINGS_HELP_LIFECYCLE_STAGES: readonly FindingsHelpLifecycleStage[] = [
  {
    status: "Open",
    meaning: "The finding is active and has no final resolve outcome.",
  },
  {
    status: "Under review",
    meaning: "Human review is pending or additional evidence is being evaluated.",
  },
  {
    status: "Assigned",
    meaning: "An owner is accountable for remediation or follow-up.",
  },
  {
    status: "Remediation planned",
    meaning: "Work is deferred or scheduled with a revisit or due date.",
  },
  {
    status: "Resolved",
    meaning: "Remediation is recorded and the finding is no longer open.",
  },
  {
    status: "Accepted or waived",
    meaning: "Risk is accepted, waived, or covered by a time-bounded exception.",
  },
] as const;

export const FINDINGS_HELP_ACTIONS_INTRO =
  "Authorized users with permission to update findings can update findings. Readers without those permissions can still review severity, evidence, and disposition history.";

export const FINDINGS_HELP_ACTIONS = [
  {
    action: "Assign an owner",
    detail: "Route accountability for remediation or monitoring.",
  },
  {
    action: "Add remediation guidance",
    detail: "Document the planned fix, due date, or monitoring approach.",
  },
  {
    action: "Link evidence",
    detail: "Attach or reference supporting material for audit readiness.",
  },
  {
    action: "Record a decision",
    detail: "Capture acceptance, deferral, remediation, or rejection with rationale.",
  },
  {
    action: "Accept the risk",
    detail: "Document why the finding can proceed with known exposure.",
  },
  {
    action: "Request an exception",
    detail: "Record a time-bounded waiver when policy relief is required.",
  },
  {
    action: "Mark resolved",
    detail: "Close the finding after remediation is complete.",
  },
  {
    action: "Reopen after reevaluation",
    detail: "Restore an open status when new evidence changes the assessment.",
  },
] as const;

export const FINDINGS_HELP_GOVERNANCE_INTRO =
  "Findings connect day-to-day architecture work to approval tracking:";

export const FINDINGS_HELP_GOVERNANCE_ITEMS = [
  "Findings influence whether a review is ready for approval or export.",
  "Severe unresolved findings may require explicit approval or an exception.",
  "Policy and standards results provide context for each finding.",
  "Decisions and exceptions become part of the audit trail.",
  "Material findings may appear in sponsor and approval reporting.",
] as const;

export type FindingsHelpRoleGuidance = {
  readonly role: string;
  readonly guidance: string;
};

export const FINDINGS_HELP_ROLE_GUIDANCE: readonly FindingsHelpRoleGuidance[] = [
  {
    role: "Solution architect",
    guidance:
      "Reviews findings, adds context, assigns remediation, and prepares the architecture for follow-up.",
  },
  {
    role: "Reviewer",
    guidance: "Validates evidence, severity, business impact, and recommended action.",
  },
  {
    role: "Approval lead",
    guidance: "Records decisions, approvals, exceptions, and escalation requirements.",
  },
  {
    role: "Sponsor or sponsor",
    guidance: "Reviews material risk, unresolved exposure, and decision status.",
  },
] as const;

export const FINDINGS_HELP_WHAT_IS_BODY =
  "During a review, ArchLucid compares architecture evidence against active policies and standards. When a gap or risk is detected, the product records a finding with severity, impact, and recommended action. Findings stay linked to the review so teams can investigate, track, and report on them consistently.";

export const FINDINGS_HELP_SEVERITY_INTRO =
  "Severity reflects how urgently a finding should be addressed. Business impact explains why the issue matters to delivery, security, or compliance. Both appear on the finding and in approval summaries.";

export const FINDINGS_HELP_RESPOND_INTRO =
  "Responding to a finding means reviewing evidence, recording a disposition, and tracking follow-up until the risk is resolved, accepted, or waived.";

export const FINDINGS_HELP_CLAIM_HEADING_ID = "help-findings-claim-discipline-heading" as const;

export const FINDINGS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-a-finding-is", title: "What a finding is" },
  { level: 2, id: "anatomy-of-a-finding", title: "Anatomy of a finding" },
  { level: 2, id: "where-findings-come-from", title: "Where findings come from" },
  { level: 2, id: "severity-and-impact", title: "Severity and impact" },
  { level: 2, id: "inspect-the-evidence", title: "Inspect the evidence" },
  { level: 2, id: "respond-to-a-finding", title: "Respond to a finding" },
  { level: 2, id: "findings-and-governance", title: "Findings and approval" },
  { level: 2, id: "role-guidance", title: "What each role usually does" },
  { level: 2, id: FINDINGS_HELP_CLAIM_HEADING_ID, title: FINDINGS_HELP_CLAIM_DISCIPLINE_HEADING },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: claim band owns diligence limits; overview stays affirmative. */
export const FINDINGS_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not a full audit export", "sources package"],
  claimMustNotContain: ["sources package", "sealed-review diligence"],
} as const;
