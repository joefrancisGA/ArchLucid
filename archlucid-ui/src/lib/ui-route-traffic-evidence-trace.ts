/**
 * Traffic workbook row ID for finding evidence-trace (canonical inspect surface).
 * Owner backlog shorthand: ERU.
 */
export const EVIDENCE_TRACE_TRAFFIC_ROW_ID = "ERU";

/** Canonical path tracked on the ERU workbook row. */
export const EVIDENCE_TRACE_TRAFFIC_PATH =
 "/architecture/reviews/[reviewId]/findings/[findingId]/evidence-trace";

/** Workbook Section column value. */
export const EVIDENCE_TRACE_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for ERU - documents Evidence chrome on finding evidence-trace.
 * ASCII-only for Windows console note scripts.
 */
export const EVIDENCE_TRACE_TRAFFIC_NOTE =
  "Finding evidence-trace (Core review) - FindingInspectView with PageContextualHelpButton (topic map findings; Category-1 path matcher), finding-first H1 eyebrow (TB-1826-TB-1829), Back to finding primary wayfinding (TB-1828), OperatorEvidenceLimitsFooter without inspect self-link on ERU (TB-1827), governance stickiness demoted to sectionTitle (TB-1826). Sibling RRF = finding detail; RRE = review workspace. Inspection trace for one finding - not a full sealed-record diligence Sources trail alone. Score 54/100 (2026-07-27) - owner review band; hard-caps higher Evidence without sealed-record diligence Sources trail.";
