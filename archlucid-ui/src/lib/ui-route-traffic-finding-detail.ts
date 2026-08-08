/**
 * Traffic workbook row ID for Finding detail.
 * Owner backlog shorthand: RRF.
 */
export const FINDING_DETAIL_TRAFFIC_ROW_ID = "RRF";

/** Canonical path tracked on the RRF workbook row. */
export const FINDING_DETAIL_TRAFFIC_PATH = "/architecture/reviews/[runId]/findings/[findingId]";

/** Workbook Section column value. */
export const FINDING_DETAIL_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for RRF - documents Evidence chrome on finding detail.
 * ASCII-only for Windows console note scripts.
 */
export const FINDING_DETAIL_TRAFFIC_NOTE =
  "Finding detail (Core review) - FindingDetailPageView with PageContextualHelpButton (topic map findings; Category-1 path matcher), FindingDetailEvidenceOrientationStrip (Sources + claim-discipline: single-finding disposition only), wayfinding, policy citation hero, operational actions, Evidence trace CTA. Sibling ERU = evidence-trace. Not a full signed-record diligence package alone. Score 58/100 (2026-08-08) - disposition Evidence pass; hard-caps higher Evidence without full diligence packing. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
