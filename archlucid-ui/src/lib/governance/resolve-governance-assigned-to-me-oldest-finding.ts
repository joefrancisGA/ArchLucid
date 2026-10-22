import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type GovernanceAssignedToMeOldestFindingTarget = {
  readonly findingId: string;
  readonly findingTitle: string;
  readonly runId: string;
  readonly agingDays: number | null;
};

function parseDueUtc(row: GovernanceFindingQueueRow): number | null {
  const raw = row.revisitDueUtc?.trim() ?? row.waiverExpiresAtUtc?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  const parsed = Date.parse(raw);

  return Number.isNaN(parsed) ? null : parsed;
}

function compareAssignedToMeOldestFindings(
  left: GovernanceFindingQueueRow,
  right: GovernanceFindingQueueRow,
): number {
  const leftAging = left.agingDays ?? -1;
  const rightAging = right.agingDays ?? -1;
  const agingDelta = rightAging - leftAging;

  if (agingDelta !== 0) {
    return agingDelta;
  }

  const leftDue = parseDueUtc(left);
  const rightDue = parseDueUtc(right);

  if (leftDue === null && rightDue === null) {
    return left.title.localeCompare(right.title);
  }

  if (leftDue === null) {
    return 1;
  }

  if (rightDue === null) {
    return -1;
  }

  const dueDelta = leftDue - rightDue;

  if (dueDelta !== 0) {
    return dueDelta;
  }

  return left.title.localeCompare(right.title);
}

/** Oldest assigned finding by aging days, then soonest due date. */
export function resolveGovernanceAssignedToMeOldestFinding(
  rows: readonly GovernanceFindingQueueRow[],
): GovernanceAssignedToMeOldestFindingTarget | null {
  const findings = rows.filter((row) => row.recordKind === "finding");

  if (findings.length === 0) {
    return null;
  }

  const sorted = [...findings].sort(compareAssignedToMeOldestFindings);
  const oldest = sorted[0];

  if (oldest === undefined) {
    return null;
  }

  return {
    findingId: oldest.findingId,
    findingTitle: oldest.title,
    runId: oldest.runId,
    agingDays: oldest.agingDays ?? null,
  };
}
