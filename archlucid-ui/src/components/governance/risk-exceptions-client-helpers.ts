import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";

import {
  type RiskExceptionDisplayStatus,
} from "./risk-exception-status";

export function statusTagFor(displayStatus: RiskExceptionDisplayStatus): {
  kind: "ready" | "needs-attention" | "blocked";
  label: string;
} {
  if (displayStatus === "expired") {
    return { kind: "blocked", label: "Expired" };
  }

  if (displayStatus === "expiring-soon") {
    return { kind: "needs-attention", label: "Expiring soon" };
  }

  return { kind: "ready", label: "Active" };
}

export function riskExceptionsLoadFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to load risk exceptions.";
}

export function sortByExpiryAsc(records: RiskExceptionRecord[]): RiskExceptionRecord[] {
  return [...records].sort((left, right) => Date.parse(left.expiresAtUtc) - Date.parse(right.expiresAtUtc));
}

export function toDatetimeLocalInputValue(isoUtc: string): string {
  const parsed = new Date(isoUtc);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const pad = (value: number): string => String(value).padStart(2, "0");

  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}T${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}`;
}

export function matchesRiskExceptionRunScope(record: RiskExceptionRecord, scopedRunId: string): boolean {
  if (scopedRunId.trim().length === 0) {
    return true;
  }

  const recordRunId = (record.runId ?? "").trim();

  return recordRunId.length > 0 && recordRunId === scopedRunId.trim();
}
