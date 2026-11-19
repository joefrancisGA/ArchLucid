/** Status filter empty is not proof the workbench has no instances under partial capture. */
export const REMEDIATION_WORKBENCH_STATUS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE =
  "No instances match this status filter is not proof this snapshot has no remediation instances when inventory capture completed with gaps." as const;

export const REMEDIATION_WORKBENCH_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE =
  "Instances loaded, but this status filter matches none. Clear the status filter to see the board." as const;