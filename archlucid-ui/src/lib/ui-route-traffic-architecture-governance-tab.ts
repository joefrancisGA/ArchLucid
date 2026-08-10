/**
 * Traffic workbook row ID for create-home Governance archTab.
 * Owner backlog shorthand: REG.
 */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_ROW_ID = "REG";

/** Canonical path tracked on the REG workbook row. */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_PATH = "/architecture/reviews/[runId]?archTab=governance";

/** Workbook Section column value â€” create-home tab surface, not a generic review tab. */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REG â€” create-home-only honesty + Evidence chrome.
 */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_NOTE =
 "Create-home-only archTab (TB-1856) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=decisions-remediation). RunDetailGovernanceDecisionSection pre-commit honesty (TB-1857) with one primary Review findings CTA (TB-1859), secondary activity text link, Sources diligence strip (governance-approval, audit-trail, findings, search-review-evidence, compare-two-reviews), claim-discipline callout, and sponsor/work-item panels gated on manifestId (TB-1858). Not a live approval/audit surface. Score 60/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
