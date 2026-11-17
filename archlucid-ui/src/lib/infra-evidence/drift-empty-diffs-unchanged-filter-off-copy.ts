export const DRIFT_WORKBENCH_EMPTY_DIFFS_UNCHANGED_FILTER_OFF_LINE =
  "Include unchanged is off — resources with no detected changes are hidden, so an empty diff table does not prove zero drift." as const;

export function shouldShowDriftEmptyDiffsUnchangedFilterOffHonesty(includeUnchanged: boolean): boolean {
  return !includeUnchanged;
}