export const REMEDIATION_PRIORITY_WHEN_THIS_WEEK = "This week" as const;

export const REMEDIATION_PRIORITY_WHEN_THIS_MONTH = "This month" as const;

export const REMEDIATION_PRIORITY_WHEN_LATER = "Later" as const;

export const REMEDIATION_PRIORITY_WHEN_HEADER_HELPER =
  "This week, this month, or later follows the queue order. It is not a separate score." as const;

export const REMEDIATION_PRIORITY_WHEN_BAND_NOT_STORED = "When band was not stored." as const;
const REMEDIATION_PRIORITY_WHEN_THIS_WEEK_MAX_RANK = 5;

const REMEDIATION_PRIORITY_WHEN_THIS_MONTH_MAX_RANK = 25;

export function resolveRemediationPriorityQueueRankOrder(
  rankOrder: number | null | undefined,
  oneBasedRowIndex: number,
): number {
  if (rankOrder !== null && rankOrder !== undefined) {
    return rankOrder;
  }

  return oneBasedRowIndex;
}

export function formatRemediationPriorityWhenBandForRankOrder(
  rankOrder: number | null | undefined,
): string {
  if (rankOrder === null || rankOrder === undefined) {
    return REMEDIATION_PRIORITY_WHEN_BAND_NOT_STORED;
  }

  return formatRemediationPriorityWhenBand(rankOrder);
}

export function formatRemediationPriorityWhenBandForQueueRow(
  rankOrder: number | null | undefined,
  oneBasedRowIndex: number,
): string {
  return formatRemediationPriorityWhenBand(
    resolveRemediationPriorityQueueRankOrder(rankOrder, oneBasedRowIndex),
  );
}

export function formatRemediationPriorityWhenBand(rank: number): string {
  if (rank <= REMEDIATION_PRIORITY_WHEN_THIS_WEEK_MAX_RANK) {
    return REMEDIATION_PRIORITY_WHEN_THIS_WEEK;
  }

  if (rank <= REMEDIATION_PRIORITY_WHEN_THIS_MONTH_MAX_RANK) {
    return REMEDIATION_PRIORITY_WHEN_THIS_MONTH;
  }

  return REMEDIATION_PRIORITY_WHEN_LATER;
}
