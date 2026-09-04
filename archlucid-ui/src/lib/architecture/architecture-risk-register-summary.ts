import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type ArchitectureRiskRegisterSummary = {
  readonly openRisks: number;
  readonly expiringExceptions: number;
  readonly pendingOwner: number;
  readonly overdueReview: number;
};

const WAIVER_EXPIRING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function isFindingRow(row: GovernanceFindingQueueRow): boolean {
  return row.recordKind === "finding";
}

function hasExpiringException(row: GovernanceFindingQueueRow, nowMs: number): boolean {
  const expiresRaw = row.waiverExpiresAtUtc?.trim() ?? "";

  if (expiresRaw.length === 0) {
    return false;
  }

  const expiresMs = Date.parse(expiresRaw);

  if (Number.isNaN(expiresMs)) {
    return false;
  }

  return expiresMs <= nowMs + WAIVER_EXPIRING_WINDOW_MS;
}

function isOverdueReview(row: GovernanceFindingQueueRow, nowMs: number): boolean {
  const dueRaw = row.revisitDueUtc?.trim() ?? "";

  if (dueRaw.length === 0) {
    return false;
  }

  const dueMs = Date.parse(dueRaw);

  if (Number.isNaN(dueMs)) {
    return false;
  }

  return dueMs < nowMs;
}

function isOpenRisk(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const normalized = row.status.toLowerCase();

  if (normalized.includes("recorded")) {
    return false;
  }

  if (normalized.includes("closed") || normalized.includes("resolved")) {
    return false;
  }

  return true;
}

function hasPendingOwner(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  return (row.ownerUserId?.trim() ?? "").length === 0;
}

export function computeArchitectureRiskRegisterSummary(
  rows: readonly GovernanceFindingQueueRow[],
  nowMs: number = Date.now(),
): ArchitectureRiskRegisterSummary {
  return {
    openRisks: rows.filter((row) => isOpenRisk(row)).length,
    expiringExceptions: rows.filter((row) => hasExpiringException(row, nowMs)).length,
    pendingOwner: rows.filter((row) => hasPendingOwner(row)).length,
    overdueReview: rows.filter((row) => isOverdueReview(row, nowMs)).length,
  };
}
