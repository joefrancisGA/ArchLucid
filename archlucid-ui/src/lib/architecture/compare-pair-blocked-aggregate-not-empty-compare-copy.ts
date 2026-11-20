/** Compare pair POST blocked — aggregate failure is a gate, not an empty diff payload. */
export const COMPARE_PAIR_BLOCKED_AGGREGATE_NOT_EMPTY_COMPARE_LINE =
  "This blocked compare request reflects lifecycle or seal gates on one or both reviews. It is not an empty comparison result and not a successful zero-change manifest." as const;
