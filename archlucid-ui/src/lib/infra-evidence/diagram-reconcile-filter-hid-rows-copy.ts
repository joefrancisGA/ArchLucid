export const DIAGRAM_RECONCILE_FILTER_HID_ROWS_LINE =
  "Stored correspondence rows exist for this reconciliation run, but the current filter or resource scope shows none — clear the filter or scope to review hidden rows." as const;

export function shouldShowDiagramReconcileFilterHidRowsHonesty(storedRowCount: number, visibleRowCount: number): boolean {
  return storedRowCount > 0 && visibleRowCount === 0;
}