import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { PLANNING_PATH } from "@/lib/planning-route";

export const IMPACT_PREVIEW_PAGE_TITLE = "Impact preview" as const;

export const IMPACT_PREVIEW_PAGE_SUBTITLE =
  "Preview how a proposed architecture change may affect findings, risk, cost, and approval impact before implementation." as const;

export const IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER =
  "Compare a proposed change against a baseline review before implementation." as const;

export const IMPACT_PREVIEW_PAGE_SUBTITLE_OPERATOR = IMPACT_PREVIEW_PAGE_SUBTITLE;

export function impactPreviewPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER : IMPACT_PREVIEW_PAGE_SUBTITLE_OPERATOR;
}

export const IMPACT_PREVIEW_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const IMPACT_PREVIEW_SCOPE_DETAILS_TRIGGER = "About impact preview" as const;

export const IMPACT_PREVIEW_ORIENTATION =
  "Select a proposed change and baseline review to compare expected before-and-after outcomes." as const;

export const IMPACT_PREVIEW_SCOPE_WHAT_IT_IS =
  "Impact preview is a deterministic, repeatable what-if analysis that re-evaluates your policy packs and recorded findings against a proposed change — the same checks that ran in the review, so results are policy-consistent, not a fresh opinion." as const;

export const IMPACT_PREVIEW_SCOPE_WHAT_IT_IS_NOT =
  "It does not observe or test your production systems; treat results as review-time analysis, not runtime validation." as const;

/** Canonical notice: affirmative value first, then the production disclaimer. */
export const IMPACT_PREVIEW_TRUST_NOTICE =
  `${IMPACT_PREVIEW_SCOPE_WHAT_IT_IS} ${IMPACT_PREVIEW_SCOPE_WHAT_IT_IS_NOT}` as const;

export const IMPACT_PREVIEW_LOADING_STATUS = "Loading impact preview…";

export const IMPACT_PREVIEW_LIST_LOAD_RETRY_LABEL = "Try again";

export const IMPACT_PREVIEW_DETAIL_LOAD_RETRY_LABEL = "Retry loading results";

export const IMPACT_PREVIEW_SIMULATE_RETRY_LABEL = "Retry simulation";

export const IMPACT_PREVIEW_BASELINE_REVIEW_ID_LABEL = "Baseline review id" as const;

export const IMPACT_PREVIEW_ACTION_REFRESH = "Refresh" as const;
export const IMPACT_PREVIEW_ACTION_REFRESHING = "Refreshing…" as const;
export const IMPACT_PREVIEW_ACTION_SIMULATE = "Simulate impact" as const;
export const IMPACT_PREVIEW_ACTION_CREATE_PROPOSED_CHANGE = "Create proposed change" as const;
export const IMPACT_PREVIEW_ACTION_OPEN_PLANNING = "Open Planning" as const;
export const IMPACT_PREVIEW_ACTION_OPEN_REVIEW_PACKAGES = "Open reviews" as const;
export const IMPACT_PREVIEW_ACTION_START_REVIEW = "Start review" as const;
export const IMPACT_PREVIEW_ACTION_REQUEST_ACCESS = "Contact workspace admin" as const;

export const IMPACT_PREVIEW_EMPTY_NO_CANDIDATES_TITLE = "No proposed changes available" as const;
export const IMPACT_PREVIEW_EMPTY_NO_CANDIDATES_BODY =
  "Create a proposed architecture change before running an impact preview. Impact preview compares the proposed change against a baseline review and estimates likely changes in findings, risk, cost, and approval impact." as const;

export const IMPACT_PREVIEW_EMPTY_NO_BASELINE_TITLE = "No baseline review available" as const;
export const IMPACT_PREVIEW_EMPTY_NO_BASELINE_BODY =
  "Finalize a review before comparing proposed changes against the current baseline." as const;

export const IMPACT_PREVIEW_EMPTY_PERMISSION_TITLE = "You do not have permission to simulate impact" as const;
export const IMPACT_PREVIEW_EMPTY_PERMISSION_BODY =
  "Impact preview requires workspace permissions to read proposed changes and run simulations. Ask a workspace administrator to grant access." as const;

export const IMPACT_PREVIEW_SETUP_CARD_TITLE = "Simulation setup" as const;
export const IMPACT_PREVIEW_PROPOSED_CHANGE_LABEL = "Proposed change" as const;
export const IMPACT_PREVIEW_BASELINE_LABEL = "Baseline review" as const;
export const IMPACT_PREVIEW_COMPARISON_SCOPE_LABEL = "Comparison scope" as const;

export const IMPACT_PREVIEW_SCOPE_FINDINGS = "Findings" as const;
export const IMPACT_PREVIEW_SCOPE_RISK = "Risk" as const;
export const IMPACT_PREVIEW_SCOPE_COST = "Cost" as const;
export const IMPACT_PREVIEW_SCOPE_GOVERNANCE = "Approval impact" as const;
export const IMPACT_PREVIEW_SCOPE_EVIDENCE = "Evidence affected" as const;

export const IMPACT_PREVIEW_OUTPUT_PREVIEW_TITLE = "Impact preview will show" as const;
export const IMPACT_PREVIEW_OUTPUT_PREVIEW_ITEMS = [
  "Expected finding changes",
  "Risk changes",
  "Cost or effort estimate",
  "Approval impact changes",
  "Affected evidence and decisions",
  "Recommended next actions",
] as const;

export const IMPACT_PREVIEW_SUMMARY_FINDINGS_CHANGED = "Expected findings changed" as const;
export const IMPACT_PREVIEW_SUMMARY_RISKS_REDUCED = "Risks reduced" as const;
export const IMPACT_PREVIEW_SUMMARY_RISKS_INTRODUCED = "Risks introduced" as const;
export const IMPACT_PREVIEW_SUMMARY_COST_IMPACT = "Cost impact" as const;
export const IMPACT_PREVIEW_SUMMARY_GOVERNANCE_STATUS = "Governance status" as const;

export const IMPACT_PREVIEW_BEFORE_AFTER_TITLE = "Before-and-after comparison" as const;
export const IMPACT_PREVIEW_BEFORE_LABEL = "Current baseline" as const;
export const IMPACT_PREVIEW_AFTER_LABEL = "Proposed change" as const;

export const IMPACT_PREVIEW_RECOMMENDATION_TITLE = "Recommendation" as const;
export const IMPACT_PREVIEW_RECOMMENDATION_PROCEED = "Proceed" as const;
export const IMPACT_PREVIEW_RECOMMENDATION_PROCEED_MONITORING = "Proceed with monitoring" as const;
export const IMPACT_PREVIEW_RECOMMENDATION_NEEDS_REVIEW = "Needs review" as const;
export const IMPACT_PREVIEW_RECOMMENDATION_DO_NOT_PROCEED = "Do not proceed" as const;

export const IMPACT_PREVIEW_SUGGESTED_NEXT_STEP_LABEL = "Suggested next step" as const;

export const IMPACT_PREVIEW_RECOMMENDATION_DISCLAIMER =
  "Impact preview results are review-time analysis only — do not proceed without an accountable architecture review." as const;

export const IMPACT_PREVIEW_DO_NOT_PROCEED_WITHOUT_REVIEW =
  "Do not proceed without review — route material changes through governance before implementation." as const;

export const IMPACT_PREVIEW_DECISION_OWNERSHIP_NOTE =
  "Simulation output informs review; accountable reviewers and governance owners retain resolve authority." as const;

export const IMPACT_PREVIEW_EVIDENCE_BASIS_TITLE = "Evidence basis" as const;
export const IMPACT_PREVIEW_EVIDENCE_LINKED_FINDINGS = "Linked findings" as const;
export const IMPACT_PREVIEW_EVIDENCE_POLICY_RULES = "Related policy rules" as const;
export const IMPACT_PREVIEW_EVIDENCE_REVIEW_BASELINE = "Review baseline" as const;

export const IMPACT_PREVIEW_RESULT_ACTION_SAVE = "Save impact preview" as const;
export const IMPACT_PREVIEW_SAVE_UNAVAILABLE_HINT =
  "Saving impact previews is not available in this release." as const;
export const IMPACT_PREVIEW_RESULT_ACTION_ADVISORY = "Create advisory recommendation" as const;
export const IMPACT_PREVIEW_RESULT_ACTION_GOVERNANCE = "Send to approval workflow" as const;
export const IMPACT_PREVIEW_RESULT_ACTION_EXPORT = "Export summary" as const;

export const IMPACT_PREVIEW_HOW_IT_WORKS_TITLE = "How impact preview works" as const;
export const IMPACT_PREVIEW_HOW_IT_WORKS_SUMMARY =
  `${IMPACT_PREVIEW_SCOPE_WHAT_IT_IS} ${IMPACT_PREVIEW_SCOPE_WHAT_IT_IS_NOT}` as const;

export const IMPACT_PREVIEW_ESTIMATED_IMPACT_LABEL = "Estimated impact" as const;
export const IMPACT_PREVIEW_EXPECTED_CHANGE_LABEL = "Expected change" as const;
export const IMPACT_PREVIEW_BASED_ON_EVIDENCE_LABEL = "Based on current review evidence" as const;

export const IMPACT_PREVIEW_REVIEWS_HREF = "/architecture/reviews" as const;
export const IMPACT_PREVIEW_PLANNING_HREF = PLANNING_PATH;
export const IMPACT_PREVIEW_CREATE_REVIEW_HREF = "/architecture/reviews/new" as const;
export const IMPACT_PREVIEW_ADVISORY_HREF = "/governance/advisory-scans" as const;
export const IMPACT_PREVIEW_GOVERNANCE_HREF = GOVERNANCE_APPROVAL_QUEUE_PATH;
export const IMPACT_PREVIEW_SETTINGS_ROLES_HREF = "/administration/users?tab=roles" as const;
