import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type GovernanceAssignedToMeQueueSortKey = "severity" | "due" | "title" | "sourceReview";

const SEVERITY_ORDER: Readonly<Record<string, number>> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function parseDueUtc(row: GovernanceFindingQueueRow): number | null {
  const raw = row.revisitDueUtc?.trim() ?? row.waiverExpiresAtUtc?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  const parsed = Date.parse(raw);

  return Number.isNaN(parsed) ? null : parsed;
}

function compareSeverity(left: GovernanceFindingQueueRow, right: GovernanceFindingQueueRow): number {
  const leftRank = SEVERITY_ORDER[left.severity] ?? 99;
  const rightRank = SEVERITY_ORDER[right.severity] ?? 99;

  return leftRank - rightRank;
}

function compareDue(left: GovernanceFindingQueueRow, right: GovernanceFindingQueueRow): number {
  const leftDue = parseDueUtc(left);
  const rightDue = parseDueUtc(right);

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
