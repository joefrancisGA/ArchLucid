/** Zero finalized reviews — prerequisite, not a failed compare load. */
export const COMPARE_INSUFFICIENT_FINALIZED_ZERO_FINALIZED_NOT_LOAD_FAILURE_LINE =
  "This workspace has no finalized reviews yet. That is not a failed compare request and not an empty golden diff. Finalize at least two reviews to compare." as const;

