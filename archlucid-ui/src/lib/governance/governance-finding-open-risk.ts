import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED } from "@/components/governance/findings/governance-findings-row-omission-copy";

function isFindingRow(row: GovernanceFindingQueueRow): boolean {
  return row.recordKind === "finding";
}

/** Open findings exclude unknown status omission copy — not the same as closed. */
export function isGovernanceFindingOpenRisk(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const status = row.status.trim();

  if (status.length === 0 || status === GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED) {
    return false;
  }

  const normalized = status.toLowerCase();

  if (normalized.includes("was not stored")) {
    return false;
  }

  if (normalized.includes("recorded")) {
    return false;
  }

  if (normalized.includes("closed") || normalized.includes("resolved")) {
    return false;
  }

  return true;
}