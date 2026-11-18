/** Risk-register and NL facet filters together hide every loaded finding — not a failed findings queue read. */
export const GOVERNANCE_FINDINGS_REGISTER_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE =
  "Findings loaded, but the risk register and severity or status filters together match none. Clear the register filter or reset NL facets to see the full queue." as const;
