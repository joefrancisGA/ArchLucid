/** Shared row threshold for operator high-churn flat lists (TB-694 / TB-935). */
export const OPERATOR_LIST_VIRTUALIZE_MIN_ROWS = 50;

export function shouldVirtualizeOperatorList(rowCount: number): boolean {
  return rowCount >= OPERATOR_LIST_VIRTUALIZE_MIN_ROWS;
}
