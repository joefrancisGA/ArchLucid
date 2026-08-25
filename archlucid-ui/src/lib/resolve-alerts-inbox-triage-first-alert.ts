import { alertPrimaryFindingDetailHref } from "@/lib/alert-finding-navigation";
import type { AlertRecord } from "@/types/alerts";

const ALERT_SEVERITY_ORDER: Readonly<Record<string, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  warning: 5,
};

export type AlertsInboxTriageFirstAlertTarget = {
  readonly alertId: string;
  readonly title: string;
  readonly severity: string;
  readonly openHref: string | null;
};

function alertSeverityRank(severity: string): number {
  return ALERT_SEVERITY_ORDER[severity.trim().toLowerCase()] ?? 99;
}

function compareTriageAlerts(left: AlertRecord, right: AlertRecord): number {
  const severityDelta = alertSeverityRank(left.severity) - alertSeverityRank(right.severity);

  if (severityDelta !== 0) {
    return severityDelta;
  }

  const leftCreated = Date.parse(left.createdUtc);
  const rightCreated = Date.parse(right.createdUtc);

  if (Number.isNaN(leftCreated) || Number.isNaN(rightCreated)) {
    return left.createdUtc.localeCompare(right.createdUtc);
  }

  return leftCreated - rightCreated;
}

/** Highest-severity open alert, oldest first within the same severity band. */
export function resolveAlertsInboxTriageFirstAlert(
  alerts: readonly AlertRecord[],
): AlertsInboxTriageFirstAlertTarget | null {
  const openAlerts = alerts.filter(
    (alert) => alert.isArchived !== true && alert.status.trim().toLowerCase() === "open",
  );

  if (openAlerts.length === 0) {
    return null;
  }

  const sorted = [...openAlerts].sort(compareTriageAlerts);
  const first = sorted[0];

  if (first === undefined) {
    return null;
  }

  return {
    alertId: first.alertId,
    title: first.title,
    severity: first.severity,
    openHref: alertPrimaryFindingDetailHref(first),
  };
}
