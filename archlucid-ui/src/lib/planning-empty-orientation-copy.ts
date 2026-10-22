/**
 * Buyer-safe empty-path orientation for Improvement planning — teaches the outcome
 * without fabricating sample themes, plans, or roadmap data.
 */

export const IMPROVEMENT_PLANNING_EMPTY_OUTCOME_TITLE = "What you will see here" as const;

export const IMPROVEMENT_PLANNING_EMPTY_OUTCOME_INTRO =
  "After feedback is captured and analyzed, this page becomes a planning workspace — not a blank report." as const;

export const IMPROVEMENT_PLANNING_EMPTY_OUTCOME_THEMES =
  "Top improvement themes — recurring feedback patterns ranked by captured signals." as const;

export const IMPROVEMENT_PLANNING_EMPTY_OUTCOME_PLANS =
  "Prioritized improvement plans — action plans with owners, steps, and supporting evidence." as const;

export const IMPROVEMENT_PLANNING_EMPTY_OUTCOME_EXPORT =
  "Export planning summary — shareable report and data export once plans exist." as const;

export const IMPROVEMENT_PLANNING_MATURITY_TITLE = "Planning progress" as const;

export const IMPROVEMENT_PLANNING_MATURITY_STAGE_FEEDBACK = "Collect feedback" as const;

export const IMPROVEMENT_PLANNING_MATURITY_STAGE_THEMES = "Themes" as const;

export const IMPROVEMENT_PLANNING_MATURITY_STAGE_PLANS = "Plans" as const;

export const IMPROVEMENT_PLANNING_MATURITY_CURRENT_HINT =
  "You are on the first stage: capture review feedback so themes and plans can be derived." as const;

/**
 * Operator-facing priority explanation aligned with ProductLearningOpportunityScoring
 * (severity band + rank boost + evidence signal mass) — without internal scheme IDs.
 */
export const IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN =
  "Priority score ranks plans from severity, relative opportunity rank, and how many feedback signals support the theme — higher scores surface first." as const;
