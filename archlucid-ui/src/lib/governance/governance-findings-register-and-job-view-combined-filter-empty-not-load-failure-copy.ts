/** Risk-register and job view filters together hide every loaded finding — not a failed findings queue read. */
export const GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE =
  "Findings loaded, but the risk register and job view filters together match none. Clear the register filter or job view to see the full queue." as const;