/**
 * Traffic workbook row ID for finding evidence-trace (canonical inspect surface).
 * Owner backlog shorthand: ERU.
 */
export const EVIDENCE_TRACE_TRAFFIC_ROW_ID = "ERU";

/** Canonical path tracked on the ERU workbook row. */
export const EVIDENCE_TRACE_TRAFFIC_PATH =
  "/architecture/reviews/[runId]/findings/[findingId]/evidence-trace";

/** Workbook Section column value. */
export const EVIDENCE_TRACE_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for ERU — absorbs former RR (legacy `/inspect` redirect) hit share.
 */
export const EVIDENCE_TRACE_TRAFFIC_NOTE =
  "Finding evidence-trace (canonical inspector). Absorbs former RR hit share from retired legacy `/inspect` bookmark row (FindingInspectLegacyRedirectPage still permanentRedirects here). Score transferred from RR Evidence hard-cap (redirect/shim honesty). Does not imply CPA SOC 2 or third-party pen-test publication.";
