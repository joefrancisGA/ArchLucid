/**
 * Traffic workbook row ID for create-home Governance archTab.
 * Owner backlog shorthand: REG.
 */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_ROW_ID = "REG";

/** Canonical path tracked on the REG workbook row. */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_PATH = "/architecture/reviews/[runId]?archTab=governance";

/** Workbook Section column value — create-home tab surface, not a generic review tab. */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REG — create-home-only honesty + Evidence chrome.
 */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_NOTE =
  "Create-home-only archTab (TB-1856) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed review record; ignored on committed ReviewDetailWorkspace (twin: reviewTab=decisions-remediation). RunDetailGovernanceDecisionSection pre-commit honesty (TB-1857) with readiness dl (blocking findings, open exceptions, approval gate), governance-warning callout when needed, What happens next steps, finalize-readiness primary CTA to Activity finalize anchor, secondary activity text link, inline governance-approval and audit-trail help cites, info claim-discipline callout, governance loading skeleton, compact context-bar when tab active, and sponsor/work-item panels gated on manifestId (TB-1858). Not a live approval/audit surface. Score 60/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
