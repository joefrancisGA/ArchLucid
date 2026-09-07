/**
 * Operator home sample and example-review copy.
 */

export const BUYER_HOME_SAMPLE_PACKAGE_HEADLINE =
  "Explore a completed example review";

export const BUYER_HOME_SAMPLE_PACKAGE_SUBTITLE =
  "Completed architecture review with sealed review record, evidence trail, and audit record.";

export const BUYER_HOME_SAMPLE_PACKAGE_LEAD =
  "Review a completed example review with evidence trail, findings, approval, and audit-ready artifacts before creating your first review.";

export const BUYER_HOME_PRIMARY_CTA = "Open sample finding";

/** Quiet label above the non-clickable sample finding preview rows — signals "content", not "actions". */
export const OPERATOR_HOME_SAMPLE_FINDINGS_INCLUDES_LABEL = "Sample includes:";

export const OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA = "Run guided review";

export const OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA = "Open review";

/** @deprecated Prefer {@link OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}. */
export const OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA = OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA;

/** Empty Overview primary CTA on demo/seeded Claims Intake / Workspace A/B pins (TB-1039). */
export const OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA = "Open sample review";

/** Bridge when demo/seeded Overview skips setup and opens the sample review (TB-1039). */
export const OPERATOR_HOME_DEMO_SEEDED_SAMPLE_BRIDGE =
  "This demo workspace includes a finished sample review — open it to see findings, evidence, and decisions.";

export const OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA = "Open creation example";

/** @deprecated Prefer {@link OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA}. */
export const OPERATOR_HOME_OPEN_CREATED_SAMPLE_CTA = OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA;

export const OPERATOR_HOME_CREATION_EXAMPLE_TITLE = "Architecture creation example";

export const OPERATOR_HOME_CREATION_EXAMPLE_BODY =
  "See how ArchLucid turns goals and constraints into an architecture.";

export const OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_TITLE = "Guided review example";

export const OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_BODY =
  "See how ArchLucid evaluates a sample architecture.";

export const OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE = "Explore a completed review";

export const OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_BODY =
  "Inspect real findings, evidence, decisions, and a finalized review before using your own architecture.";

export const OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE = "Best for evaluating ArchLucid";

export const OPERATOR_HOME_MISSING_COMPLETED_SAMPLE_MESSAGE =
  "No completed sample has been selected for this workspace.";

export const OPERATOR_HOME_COMPLETED_SAMPLE_FETCH_ERROR_MESSAGE =
  "Could not load the completed sample for this workspace. Try refreshing the page.";

export const OPERATOR_HOME_CHOOSE_SAMPLE_REVIEW_CTA = "Choose sample review";

/** Compact findings line for featured home review rows — long monitored-risk copy lives in Details. */
export function formatOperatorHomeFeaturedFindingsSummary(
  findingCount: number,
  warningCount: number,
): string {
  const safeFindings = Number.isFinite(findingCount) ? Math.max(0, Math.trunc(findingCount)) : 0;
  const safeWarnings = Number.isFinite(warningCount) ? Math.max(0, Math.trunc(warningCount)) : 0;
  const findingsWord = safeFindings === 1 ? "finding" : "findings";
  const riskWord = safeWarnings === 1 ? "risk" : "risks";

  if (safeWarnings > 0) {
    return `${safeFindings} ${findingsWord} · ${safeWarnings} monitored ${riskWord}`;
  }

  return `${safeFindings} ${findingsWord}`;
}

/** @deprecated Removed from first-run hero — retained for legacy imports. */
export const OPERATOR_HOME_RECOMMENDED_FIRST_BADGE = "Best for evaluating ArchLucid";

export const OPERATOR_HOME_RECOMMENDED_NEXT_STATIC =
  "Open the completed review to see findings, evidence, and decisions before your first review.";

export const OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE = OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA;

export const OPERATOR_HOME_EXPLORE_SAMPLE_HEADING = "See ArchLucid in action";

export const OPERATOR_HOME_EXPLORE_SAMPLE_LEAD =
  "Explore how ArchLucid creates an architecture or evaluates one through a guided review.";

export const OPERATOR_HOME_OPEN_COMPLETED_SAMPLE_HINT =
  "Inspect findings, evidence, and decisions from a finished review.";

export const OPERATOR_HOME_RUN_SAMPLE_REVIEW_HINT = OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_BODY;

/** @deprecated Prefer {@link OPERATOR_HOME_EXPLORE_SAMPLE_HEADING} — retained for legacy imports. */
export const OPERATOR_HOME_SAMPLE_FINDINGS_HEADING = OPERATOR_HOME_EXPLORE_SAMPLE_HEADING;

/** @deprecated Prefer {@link OPERATOR_HOME_EXPLORE_SAMPLE_LEAD}. */
export const OPERATOR_HOME_SAMPLE_FINDINGS_LEAD = OPERATOR_HOME_EXPLORE_SAMPLE_LEAD;

export const OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER =
  "Example review — not your workspace data. Open the full review for findings, evidence, and the sealed record.";

export const SAMPLE_REVIEW_AHA_FINDING_LABEL = "Finding";

export const SAMPLE_REVIEW_AHA_WHY_LABEL = "Why it matters";

export const SAMPLE_REVIEW_AHA_EVIDENCE_LABEL = "Evidence support";

export const SAMPLE_REVIEW_AHA_DECISION_LABEL = "Decision change";

export const SAMPLE_REVIEW_AHA_DEMO_LABEL = "Example review";

export const SAMPLE_REVIEW_PACKAGE_AHA_HEADING = "Your first-value moment";

export const SAMPLE_REVIEW_PACKAGE_AHA_LEAD =
  "This sample review leads with one decision-changing finding — expand evidence and exports below when ready.";

/** Recent reviews outcome when only a demo/seeded or showcase sample is visible. */
export const OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME =
  "Showing a completed example review. Your reviews will appear here.";

export const BUYER_HOME_EXAMPLE_PACKAGE_SHORTCUTS_ARIA = "Example review shortcuts";

export const BUYER_HOME_EXAMPLE_PACKAGE_HEADING = "Example review";

export const BUYER_HOME_EXAMPLE_PACKAGE_LEAD =
  "Open a completed example to see the output, then start your own review.";

export const BUYER_HOME_EXAMPLE_EXPLORE_LINK = "Explore example";

export const BUYER_HOME_WELCOME_HEADING = "Explore one formal architecture review";

export const BUYER_HOME_WELCOME_LEAD =
  "Start with the sponsor view, then the sealed review record, audit trail, and prioritized findings.";
