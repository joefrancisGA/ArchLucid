/**
 * Traffic workbook row ID for create-home Governance archTab.
 * Owner backlog shorthand: REG.
 */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_ROW_ID = "REG";

/** Canonical path tracked on the REG workbook row. */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_PATH = "/reviews/[runId]?archTab=governance";

/** Workbook Section column value — create-home tab surface, not a generic review tab. */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REG — create-home-only honesty + Evidence chrome.
 */
export const ARCHITECTURE_GOVERNANCE_TAB_TRAFFIC_NOTE =
  "Create-home-only archTab (TB-1856) - mounts on ArchitectureCreatedWorkspace when fromGeneration+create-architecture and no signed manifest; ignored on committed ReviewDetailWorkspace (twin: reviewTab=decisions-remediation). RunDetailGovernanceDecisionSection pre-commit honesty (TB-1857) with one primary Review findings CTA (TB-1859), secondary activity text link, Sources diligence strip (governance-approval, audit-trail, findings, search-review-evidence, compare-two-reviews), claim-discipline callout, and sponsor/work-item panels gated on manifestId (TB-1858). Not a live approval/audit surface. Does not imply CPA SOC 2 or third-party pen-test publication.";
