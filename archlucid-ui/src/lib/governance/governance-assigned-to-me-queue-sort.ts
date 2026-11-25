import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { resolveGovernanceQueueDueDateMs } from "@/lib/governance/governance-queue-due-date";

export type GovernanceAssignedToMeQueueSortKey = "severity" | "due" | "title" | "sourceReview";

const SEVERITY_ORDER: Readonly<Record<string, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function severityRank(severity: string): number {
  return SEVERITY_ORDER[severity.trim().toLowerCase()] ?? 99;
}

function compareSeverity(left: GovernanceFindingQueueRow, right: GovernanceFindingQueueRow): number {
  return severityRank(left.severity) - severityRank(right.severity);
}

function compareDue(left: GovernanceFindingQueueRow, right: GovernanceFindingQueueRow): number {
  const leftDue = resolveGovernanceQueueDueDateMs(left);
  const rightDue = resolveGovernanceQueueDueDateMs(right);

  if (leftDue === null && rightDue === null) {
    return 0;
  }

  if (leftDue === null) {
    return 1;
  }

  if (rightDue === null) {
    return -1;
  }

  return leftDue - rightDue;
}

export function compareGovernanceAssignedToMeQueueRows(
  left: GovernanceFindingQueueRow,
  right: GovernanceFindingQueueRow,
  sortKey: GovernanceAssignedToMeQueueSortKey,
  sortAsc: boolean,
): number {
  let result = 0;

  if (sortKey === "severity") {
    result = compareSeverity(left, right);

    if (result === 0) {
      result = compareDue(left, right);
    }
  } else if (sortKey === "due") {
    result = compareDue(left, right);

    if (result === 0) {
      result = compareSeverity(left, right);
    }
  } else if (sortKey === "title") {
    result = left.title.localeCompare(right.title);
  } else {
    result = left.runLabel.localeCompare(right.runLabel);
  }

  return sortAsc ? result : -result;
}

export function sortGovernanceAssignedToMeQueueRows(
  rows: readonly GovernanceFindingQueueRow[],
  sortKey: GovernanceAssignedToMeQueueSortKey = "severity",
  sortAsc = true,
): GovernanceFindingQueueRow[] {
  const copy = [...rows];

  copy.sort((left, right) => compareGovernanceAssignedToMeQueueRows(left, right, sortKey, sortAsc));

  return copy;
}
