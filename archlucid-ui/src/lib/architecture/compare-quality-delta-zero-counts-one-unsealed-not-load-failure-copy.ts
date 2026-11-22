/** All quality delta counts are zero while at least one review is not sealed — not a failed compare read. */
export const COMPARE_QUALITY_DELTA_ZERO_COUNTS_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE =
  "Quality delta counts are zero while at least one review is not sealed yet. That is not a failed comparison read. Finalize the updated review before expecting non-zero delta rows." as const;
