/** Flat governance findings tables virtualize at this row count (TB-694). */
export const GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS = 50;

/** Estimated row height for governance queue virtualization. */
export const GOVERNANCE_FINDINGS_QUEUE_ROW_ESTIMATE_PX = 112;

export function shouldVirtualizeGovernanceFindingsQueue(rowCount: number): boolean {
  return rowCount >= GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS;
}
