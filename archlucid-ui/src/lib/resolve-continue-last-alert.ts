import { asReadonlyArray } from "@/lib/continue-last-list-guard";
import type { AlertRecord } from "@/types/alerts";

export const ALERT_INBOX_LAST_VIEWED_STORAGE_KEY = "archlucid_alerts_inbox_continue_last_v1";

export type AlertsInboxContinueLastTarget = {
  readonly alertId: string;
  readonly title: string;
};

function readStoredAlertId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(ALERT_INBOX_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeAlertsInboxLastViewedId(alertId: string): void {
  const normalized = alertId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ALERT_INBOX_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(alert: AlertRecord): AlertsInboxContinueLastTarget {
  return {
    alertId: alert.alertId,
    title: alert.title.trim().length > 0 ? alert.title : "Alert",
  };
}

function isUnreadAlert(alert: AlertRecord): boolean {
  const status = alert.status.trim().toLowerCase();

  return status === "open" || status === "active";
}

function compareOldestCreated(left: AlertRecord, right: AlertRecord): number {
  const leftCreated = Date.parse(left.createdUtc);
  const rightCreated = Date.parse(right.createdUtc);

  if (Number.isNaN(leftCreated) || Number.isNaN(rightCreated)) {
    return left.createdUtc.localeCompare(right.createdUtc);
  }

  return leftCreated - rightCreated;
}

/** Resolves the inbox alert to pin as Continue last viewed. */
export function resolveContinueLastAlert(alerts: unknown): AlertsInboxContinueLastTarget | null {
  const normalizedAlerts = asReadonlyArray<AlertRecord>(alerts);

  if (normalizedAlerts === null) {
    return null;
  }

  const visible = normalizedAlerts.filter((alert) => alert.isArchived !== true);

  if (visible.length === 0) {
    return null;
  }

  const storedId = readStoredAlertId();

  if (storedId !== null) {
    const storedMatch = visible.find((alert) => alert.alertId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const unread = visible.filter(isUnreadAlert);
  const pool = unread.length > 0 ? unread : visible;
  const oldest = pool.slice().sort(compareOldestCreated)[0];

  return oldest === undefined ? null : toTarget(oldest);
}
