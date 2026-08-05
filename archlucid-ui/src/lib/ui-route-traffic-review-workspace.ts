/**
 * Traffic workbook row ID for the canonical review workspace detail.
 * Owner backlog shorthand: RRE.
 */
export const REVIEW_WORKSPACE_TRAFFIC_ROW_ID = "RRE";

/** Canonical path tracked on the RRE workbook row. */
export const REVIEW_WORKSPACE_TRAFFIC_PATH = "/architecture/reviews/[runId]";

/** Workbook Section column value. */
export const REVIEW_WORKSPACE_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for RRE — absorbs former SRN (legacy `/snapshot/[runId]` redirect) hit share.
 */
export const REVIEW_WORKSPACE_TRAFFIC_NOTE =
  "Review workspace detail. Absorbs former SRN hit share from retired legacy `/snapshot/[runId]` bookmark row (hard-retired — use `/architecture/reviews/{runId}?readOnly=1` leave-behind). Canonical leave-behind UX. Does not imply CPA SOC 2 or third-party pen-test publication.";
