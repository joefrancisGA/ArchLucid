import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";
import { resolveRiskExceptionDisplayStatus } from "@/components/governance/risk-exception-status";

export type RiskExceptionsTriageFirstExpiringTarget = {
  readonly riskExceptionId: string;
  readonly findingId: string;
  readonly expiresAtUtc: string;
  readonly rationale: string;
};

function isOpenRiskException(record: RiskExceptionRecord, nowMs: number): boolean {
  const normalizedStatus = record.status.trim().toLowerCase();

  if (normalizedStatus === "revoked" || normalizedStatus === "expired") {
    return false;
  }

  return resolveRiskExceptionDisplayStatus(record, nowMs) !== "expired";
}

/** Soonest-expiring open waiver for triage-first guidance. */
export function resolveRiskExceptionsTriageFirstExpiring(
  records: readonly RiskExceptionRecord[],
  nowMs: number = Date.now(),
): RiskExceptionsTriageFirstExpiringTarget | null {
  const openRecords = records.filter((record) => isOpenRiskException(record, nowMs));

  if (openRecords.length === 0) {
    return null;
  }

  const sorted = [...openRecords].sort((left, right) => {
    const leftExpires = Date.parse(left.expiresAtUtc);
    const rightExpires = Date.parse(right.expiresAtUtc);

    if (Number.isNaN(leftExpires) && Number.isNaN(rightExpires)) {
      return left.findingId.localeCompare(right.findingId);
    }

    if (Number.isNaN(leftExpires)) {
      return 1;
    }

    if (Number.isNaN(rightExpires)) {
      return -1;
    }

    return leftExpires - rightExpires;
  });

  const first = sorted[0];

  if (first === undefined) {
    return null;
  }

  return {
    riskExceptionId: first.riskExceptionId,
    findingId: first.findingId,
    expiresAtUtc: first.expiresAtUtc,
    rationale: first.rationale,
  };
}
