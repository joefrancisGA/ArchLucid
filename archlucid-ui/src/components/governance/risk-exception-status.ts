import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";

export type RiskExceptionDisplayStatus = "active" | "expiring-soon" | "expired";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function resolveRiskExceptionDisplayStatus(
  record: RiskExceptionRecord,
  nowMs: number = Date.now(),
): RiskExceptionDisplayStatus {
  const expiresMs = Date.parse(record.expiresAtUtc);

  if (Number.isNaN(expiresMs)) {
    return "active";
  }

  if (expiresMs <= nowMs) {
    return "expired";
  }

  if (expiresMs - nowMs <= FOURTEEN_DAYS_MS) {
    return "expiring-soon";
  }

  return "active";
}

export function formatRiskExceptionExpiresAtUtc(utc: string): string {
  const parsed = new Date(utc);

  if (Number.isNaN(parsed.getTime())) {
    return utc;
  }

  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

export function truncateMiddle(text: string, maxLength: number): string {
  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}…`;
}
