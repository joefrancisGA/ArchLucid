import type { AlertRecord } from "@/types/alerts";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";

export type AlertsInboxSummaryCounts = {
  readonly open: number;
  readonly acknowledged: number;
  readonly resolved: number;
  /** Open alerts with Critical or High severity — always a subset of {@link AlertsInboxSummaryCounts.open}. */
  readonly blocking: number;
  readonly lastEvaluatedUtc: string | null;
};

const BLOCKING_SEVERITIES = new Set(["Critical", "High"]);

export function isBlockingAlertSeverity(severity: string): boolean {
  return BLOCKING_SEVERITIES.has(severity.trim());
}

export function countBlockingAlerts(alerts: readonly AlertRecord[]): number {
  return alerts.filter((alert) => alert.status === "Open" && isBlockingAlertSeverity(alert.severity)).length;
}

/** Visible open-tile value: open total with blocking nested as a subset (TB-2107). */
export function formatAlertsOpenSummaryValue(open: number, blocking: number): string {
  return `${finiteIntegerCountDisplay(open)} open · ${finiteIntegerCountDisplay(blocking)} blocking`;
}

/** Accessible name for the combined open + blocking summary (TB-2107). */
export function formatAlertsOpenSummaryAriaLabel(open: number, blocking: number): string {
  return `${finiteIntegerCountDisplay(open)} open alerts, ${finiteIntegerCountDisplay(blocking)} blocking of open with Critical or High severity`;
}

export function resolveLastEvaluatedUtc(alerts: readonly AlertRecord[]): string | null {
  let latestMs: number | null = null;
  let latestIso: string | null = null;

  for (const alert of alerts) {
    const candidate = alert.lastUpdatedUtc ?? alert.createdUtc;

    if (candidate.trim().length === 0) {
      continue;
    }

    const ms = Date.parse(candidate);

    if (Number.isNaN(ms)) {
      continue;
    }

    if (latestMs === null || ms > latestMs) {
      latestMs = ms;
      latestIso = candidate;
    }
  }

  return latestIso;
}
