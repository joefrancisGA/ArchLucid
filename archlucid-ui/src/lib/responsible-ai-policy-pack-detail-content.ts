export const RESPONSIBLE_AI_POLICY_PACK_PAGE_TITLE = "Responsible AI policy pack";

export const RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL = "Responsible AI";

export const RESPONSIBLE_AI_POLICY_PACK_SUBTITLE =
  "Governance rules for responsible AI use, evidence requirements, review controls, and approval readiness.";

export const RESPONSIBLE_AI_POLICY_PACK_DISPLAY_NAME = "Responsible AI";

export const RESPONSIBLE_AI_POLICY_PACK_DESCRIPTION =
  "Use this pack to review AI-enabled architectures for data handling, model governance, transparency, monitoring, human oversight, and risk controls.";

export const RESPONSIBLE_AI_POLICY_PACK_APPLIES_TO = "AI-enabled architecture reviews";

/** Platform template baseline — not a live workspace publish version. */
export const RESPONSIBLE_AI_POLICY_PACK_BASELINE_VERSION = "1.0.0";

/** @deprecated Use {@link RESPONSIBLE_AI_POLICY_PACK_BASELINE_VERSION}. */
export const RESPONSIBLE_AI_POLICY_PACK_DEFAULT_VERSION = RESPONSIBLE_AI_POLICY_PACK_BASELINE_VERSION;

export const RESPONSIBLE_AI_POLICY_PACK_NOT_PUBLISHED_QUALIFIER = "Not published in this workspace";

export const RESPONSIBLE_AI_POLICY_PACK_RULES_BASELINE_LABEL = "Platform baseline";

export const RESPONSIBLE_AI_POLICY_PACK_SUMMARY_SOURCE =
  "Source: curated platform template (ai-governance-responsible-ai-v1)";

export const RESPONSIBLE_AI_POLICY_PACK_OVERVIEW =
  "This pack establishes reviewer expectations for AI-enabled workloads — from model inventory and provider selection through human oversight, monitoring, and audit readiness. It aligns with NIST AI RMF themes and EU AI Act review vocabulary without claiming certification.";

export const RESPONSIBLE_AI_POLICY_PACK_APPLICABILITY =
  "Apply during architecture reviews where inference, training, retrieval-augmented generation, or agent orchestration is in scope. Rules surface as findings when evidence is missing or controls are immature.";

export const RESPONSIBLE_AI_POLICY_PACK_GOVERNANCE_WORKFLOW =
  "Enable the pack in your workspace policy library, assign it to the target project, then start or refresh an architecture review. Findings tie back to rule families here; finalize the review to record governance decisions and sealed review record and evidence trail.";

export type ResponsibleAiPolicyRuleRow = {
  readonly ruleName: string;
  readonly severity: "Critical" | "High" | "Medium" | "Low";
  readonly requirement: string;
  readonly evidenceExpected: string;
};

export const RESPONSIBLE_AI_POLICY_RULE_ROWS: readonly ResponsibleAiPolicyRuleRow[] = [
  {
    ruleName: "Data privacy and minimization",
    severity: "High",
    requirement: "Document data classes, retention, and minimization for model inputs and outputs crossing trust boundaries.",
    evidenceExpected: "Data classification matrix, flow diagram, retention notes",
  },
  {
    ruleName: "Model/provider approval",
    severity: "High",
    requirement: "Identify approved models and providers with rationale for production reliance.",
    evidenceExpected: "Model registry, provider selection rationale",
  },
  {
    ruleName: "Human oversight",
    severity: "High",
    requirement: "Define when human review is required before automated decisions reach users or downstream systems.",
    evidenceExpected: "Human review process, escalation paths",
  },
  {
    ruleName: "Explainability and traceability",
    severity: "Medium",
    requirement: "Capture how reviewers can trace prompts, model versions, and outputs to accountable owners.",
    evidenceExpected: "Lineage notes, decision trace references",
  },
  {
    ruleName: "Prompt/input handling",
    severity: "High",
    requirement: "Describe sanitization, injection defenses, and allowed input sources for AI endpoints.",
    evidenceExpected: "Input handling policy, guardrail configuration",
  },
  {
    ruleName: "Output validation",
    severity: "High",
    requirement: "Validate outputs for safety, policy alignment, and factual grounding before release.",
    evidenceExpected: "Validation checklist, sampling plan",
  },
  {
    ruleName: "Monitoring and drift",
    severity: "Medium",
    requirement: "Plan observability for model performance, drift, and abuse signals after deployment.",
    evidenceExpected: "Monitoring plan, alert hooks",
  },
  {
    ruleName: "Security and access control",
    severity: "High",
    requirement: "Restrict inference surfaces with least-privilege identity, network, and secret handling.",
    evidenceExpected: "Access model, network diagram, secret posture",
  },
  {
    ruleName: "Audit logging",
    severity: "Medium",
    requirement: "Retain tamper-evident logs for prompts, model calls, and governance approvals.",
    evidenceExpected: "Audit log design, retention policy",
  },
  {
    ruleName: "Regulatory/compliance review",
    severity: "Medium",
    requirement: "Record regulatory themes reviewed (e.g., NIST AI RMF, EU AI Act mapping) and open legal gaps.",
    evidenceExpected: "Risk assessment, compliance mapping notes",
  },
];

export const RESPONSIBLE_AI_EVIDENCE_REQUIRED_ITEMS: readonly string[] = [
  "Data classification",
  "Model/provider selection rationale",
  "Risk assessment",
  "Human review process",
  "Monitoring plan",
  "Incident response path",
  "Approval record",
];

export const RESPONSIBLE_AI_POLICY_PACK_NOT_FOUND_TITLE = "Policy pack not found";

export const POLICY_PACK_DETAIL_LOAD_ERROR_TITLE = "Unable to load policy pack";

export const POLICY_PACK_DETAIL_LOAD_ERROR_BODY =
  "The policy pack catalog could not be loaded. Check your connection and try again.";

export const POLICY_PACK_DETAIL_RETRY_ACTION = "Retry";

export function buildPolicyPackDetailNotFoundBody(policyPackId: string): string {
  const trimmedId = policyPackId.trim();

  if (trimmedId.length === 0) {
    return "This policy pack is unavailable or not enabled for the current workspace.";
  }

  return `No policy pack matches "${trimmedId}" in the current workspace, or it is not enabled for this scope.`;
}

/** @deprecated Prefer {@link buildPolicyPackDetailNotFoundBody}. */
export const RESPONSIBLE_AI_POLICY_PACK_NOT_FOUND_BODY =
  "This policy pack is unavailable or not enabled for the current workspace.";

export const RESPONSIBLE_AI_RULES_TABLE_INTRO = "All rules are required for AI-enabled architecture reviews.";

export const RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE = "Assign to workspace";

/** @deprecated Prefer {@link RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE}. */
export const RESPONSIBLE_AI_ACTION_MANAGE_ASSIGNMENT = RESPONSIBLE_AI_ACTION_ASSIGN_TO_WORKSPACE;

export const RESPONSIBLE_AI_ACTION_OPEN_LIBRARY = "Open policy pack library";

export const RESPONSIBLE_AI_ACTION_START_REVIEW = "Start review with this pack";

export const RESPONSIBLE_AI_ACTION_GOVERNANCE = "Open governance workflow";

export const RESPONSIBLE_AI_ACTION_OPEN_GOVERNANCE_SETUP = "Open governance setup";

export const RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS = "View technical details";

export const RESPONSIBLE_AI_TECHNICAL_DETAILS_TITLE = "Technical details";
