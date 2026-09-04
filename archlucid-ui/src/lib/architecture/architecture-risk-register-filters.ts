import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

import { GOVERNANCE_QUEUE_DISPOSITION_NONE_LABEL } from "./architecture-risk-register-copy";

export type RiskRegisterFilter =
  | "all"
  | "open"
  | "accepted-risk"
  | "exception-granted"
  | "expiring-soon"
  | "no-owner"
  | "overdue-review"
  | "high-severity"
  | "critical-error"
  | "needs-decision"
  | "remediated-recent"
  | "stale";

/** Shared with help readiness tiles so deep links and counts use the same window. */
export const RISK_REGISTER_REMEDIATED_RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export const RISK_REGISTER_FILTER_LABELS: Record<RiskRegisterFilter, string> = {
  all: "All",
  open: "Open",
  "accepted-risk": "Accepted risk",
  "exception-granted": "Exception granted",
  "expiring-soon": "Expiring soon",
  "no-owner": "No owner",
  "overdue-review": "Overdue review",
  "high-severity": "High severity",
  "critical-error": "Critical and error",
  "needs-decision": "Needs decision",
  "remediated-recent": "Remediated (30 days)",
  stale: "Stale",
};

export const RISK_REGISTER_QUICK_FILTERS: readonly RiskRegisterFilter[] = [
  "open",
  "accepted-risk",
  "exception-granted",
  "expiring-soon",
  "no-owner",
  "overdue-review",
  "high-severity",
  "critical-error",
  "needs-decision",
  "remediated-recent",
];

const WAIVER_EXPIRING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Reads an optional product-run scope from governance findings / advisory deep links. */
export function scopedRunIdFromQuery(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** When a run scope is active, keep only queue rows for that review. */
export function matchesGovernanceFindingsRunScope(
  row: GovernanceFindingQueueRow,
  scopedRunId: string | null | undefined,
): boolean {
  const scope = scopedRunIdFromQuery(scopedRunId);

  if (scope === null) {
    return true;
  }

  return row.runId.trim().toLowerCase() === scope.toLowerCase();
}

export function riskRegisterFilterFromQuery(raw: string | null): RiskRegisterFilter {
  if (raw === "stale") {
    return "stale";
  }

  if (raw === "waiver-expiring" || raw === "expiring-soon") {
    return "expiring-soon";
  }

  if (raw === "open") {
    return "open";
  }

  if (raw === "accepted-risk") {
    return "accepted-risk";
  }

  if (raw === "exception-granted") {
    return "exception-granted";
  }

  if (raw === "no-owner") {
    return "no-owner";
  }

  if (raw === "overdue-review") {
    return "overdue-review";
  }

  if (raw === "high-severity") {
    return "high-severity";
  }

  if (raw === "critical-error") {
    return "critical-error";
  }

  if (raw === "needs-decision") {
    return "needs-decision";
  }

  if (raw === "remediated-recent") {
    return "remediated-recent";
  }

  return "all";
}

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

function isAcceptedRisk(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const normalized = `${row.status} ${row.latestDisposition ?? ""}`.toLowerCase();

  return normalized.includes("accepted");
}

function isHighSeverity(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const normalized = row.severity.trim().toLowerCase();

  return normalized === "high" || normalized === "critical";
}

function isCriticalOrErrorSeverity(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const normalized = row.severity.trim().toLowerCase();

  return normalized === "critical" || normalized === "error";
}

function isNeedsDecision(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row) || !isOpenRisk(row)) {
    return false;
  }

  const disposition = (row.latestDisposition ?? "").trim();
  const humanReview = (row.humanReviewStatusLabel ?? "").toLowerCase();

  if (disposition.length > 0 && disposition !== "NeedsEvidence") {
    return false;
  }

  if (humanReview.includes("pending")) {
    return true;
  }

  return disposition.length === 0 || disposition === "NeedsEvidence";
}

function isRemediatedRecent(row: GovernanceFindingQueueRow, nowMs: number): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const disposition = (row.latestDisposition ?? "").trim();

  if (disposition !== "Remediated") {
    return false;
  }

  const reviewedRaw = row.lastReviewedUtc?.trim() ?? "";

  if (reviewedRaw.length === 0) {
    return false;
  }

  const reviewedMs = Date.parse(reviewedRaw);

  if (Number.isNaN(reviewedMs)) {
    return false;
  }

  return nowMs - reviewedMs <= RISK_REGISTER_REMEDIATED_RECENT_WINDOW_MS;
}

function hasGrantedException(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  return (row.waiverExpiresAtUtc?.trim() ?? "").length > 0;
}

function hasPendingOwner(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  return (row.ownerUserId?.trim() ?? "").length === 0;
}

export function matchesRiskRegisterFilter(
  row: GovernanceFindingQueueRow,
  filter: RiskRegisterFilter,
  nowMs: number = Date.now(),
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "stale") {
    return isFindingRow(row) && row.isStale === true;
  }

  if (filter === "expiring-soon") {
    return hasExpiringException(row, nowMs);
  }

  if (filter === "open") {
    return isOpenRisk(row);
  }

  if (filter === "accepted-risk") {
    return isAcceptedRisk(row);
  }

  if (filter === "exception-granted") {
    return hasGrantedException(row);
  }

  if (filter === "no-owner") {
    return hasPendingOwner(row);
  }

  if (filter === "overdue-review") {
    return isOverdueReview(row, nowMs);
  }

  if (filter === "high-severity") {
    return isHighSeverity(row);
  }

  if (filter === "critical-error") {
    return isOpenRisk(row) && isCriticalOrErrorSeverity(row);
  }

  if (filter === "needs-decision") {
    return isNeedsDecision(row);
  }

  if (filter === "remediated-recent") {
    return isRemediatedRecent(row, nowMs);
  }

  return true;
}

export function governanceQueueDispositionLabel(row: GovernanceFindingQueueRow): string {
  if (row.recordKind === "decision") {
    return "Recorded decision";
  }

  const latestDisposition = row.latestDisposition?.trim() ?? "";

  if (latestDisposition.length > 0) {
    return latestDisposition;
  }

  return GOVERNANCE_QUEUE_DISPOSITION_NONE_LABEL;
}
