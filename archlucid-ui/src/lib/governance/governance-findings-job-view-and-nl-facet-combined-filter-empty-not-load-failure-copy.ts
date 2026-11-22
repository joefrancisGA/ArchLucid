/** Job view and NL facet filters together hide every loaded finding — not a failed findings queue read. */
export const GOVERNANCE_FINDINGS_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE =
  "Findings loaded, but the job view and severity or status filters together match none. Clear the job view or reset NL facets to see the full queue." as const;
