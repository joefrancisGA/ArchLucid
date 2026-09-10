import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";

/** Flat policy findings tables virtualize at this row count (TB-694). */
export const GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS = 50;

/** Estimated row height for tenant governance queue virtualization. */
export const GOVERNANCE_FINDINGS_QUEUE_ROW_ESTIMATE_PX = 112;

/** Compact assigned-to-me queue rows (P0-GOF-5). */
export const GOVERNANCE_FINDINGS_QUEUE_ASSIGNED_TO_ME_ROW_ESTIMATE_PX = 64;

export function shouldVirtualizeGovernanceFindingsQueue(rowCount: number): boolean {
  return rowCount >= GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS;
}

export function governanceFindingsQueueRowEstimatePx(
  mode: GovernanceFindingsQueueMode = "tenant",
): number {
  return mode === "assigned-to-me"
    ? GOVERNANCE_FINDINGS_QUEUE_ASSIGNED_TO_ME_ROW_ESTIMATE_PX
    : GOVERNANCE_FINDINGS_QUEUE_ROW_ESTIMATE_PX;
}
