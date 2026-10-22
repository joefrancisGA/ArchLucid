import "server-only";

import type { AccessRequestPayload } from "@/lib/server/access-request-validation";

export type AccessRequestAuditStatus = "accepted" | "honeypot" | "duplicate" | "email_failed" | "misconfigured";

export type AccessRequestAuditEntry = {
  readonly timestampUtc: string;
  readonly workEmail: string;
  readonly company: string;
  readonly status: AccessRequestAuditStatus;
};

const recentByEmail = new Map<string, number>();
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function resetAccessRequestAuditStateForTests(): void {
  recentByEmail.clear();
}

export function hasRecentAccessRequest(workEmail: string, nowMs: number = Date.now()): boolean {
  const lastMs = recentByEmail.get(workEmail.trim().toLowerCase());

  if (lastMs === undefined) {
    return false;
  }

  return nowMs - lastMs < DUPLICATE_WINDOW_MS;
}

export function recordAcceptedAccessRequest(workEmail: string, nowMs: number = Date.now()): void {
  recentByEmail.set(workEmail.trim().toLowerCase(), nowMs);
}

export function logAccessRequestAudit(entry: AccessRequestAuditEntry): void {
  console.info("[access-request]", JSON.stringify(entry));
}

export function logAcceptedAccessRequest(payload: AccessRequestPayload): void {
  logAccessRequestAudit({
    timestampUtc: new Date().toISOString(),
    workEmail: payload.workEmail,
    company: payload.company,
    status: "accepted",
  });
}
