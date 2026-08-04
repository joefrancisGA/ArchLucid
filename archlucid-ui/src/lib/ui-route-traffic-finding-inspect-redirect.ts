/**
 * Traffic workbook row ID for legacy finding inspect redirect.
 * Owner backlog shorthand: RR.
 */
export const FINDING_INSPECT_REDIRECT_TRAFFIC_ROW_ID = "RR";

/** Canonical path tracked on the RR workbook row (legacy bookmark). */
export const FINDING_INSPECT_REDIRECT_TRAFFIC_PATH =
  "/architecture/reviews/[runId]/findings/[findingId]/inspect";

/** Workbook Section column value. */
export const FINDING_INSPECT_REDIRECT_TRAFFIC_SECTION = "Core review";

/**
 * Owner workbook Notes for RR — permanent redirect shim to evidence-trace.
 */
export const FINDING_INSPECT_REDIRECT_TRAFFIC_NOTE =
  "Legacy finding inspect bookmark - FindingInspectLegacyRedirectPage permanentRedirects to canonical evidence-trace (ERU / architecture reviews path via getFindingEvidenceTraceHref). No standalone Evidence chrome on the shim. Redirect/shim hard-caps Evidence. Does not imply CPA SOC 2 or third-party pen-test publication.";
