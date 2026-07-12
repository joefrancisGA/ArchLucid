import type { AlertRecord } from "@/types/alerts";

export type AlertsInboxSummaryCounts = {
  readonly open: number;
  readonly acknowledged: number;
  readonly resolved: number;
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
