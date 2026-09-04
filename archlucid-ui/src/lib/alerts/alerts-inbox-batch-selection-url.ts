import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";

export const ALERTS_INBOX_BULK_PARAM = "bulkAlerts";
export const ALERTS_INBOX_LOOP_PARAM = "alertLoopId";
export const ALERTS_INBOX_ACTION_ALERT_PARAM = "alertActionId";
export const ALERTS_INBOX_ACTION_KIND_PARAM = "alertAction";

export const ALERTS_INBOX_ACTION_KIND_OPTIONS = ["Acknowledge", "Resolve", "Suppress"] as const;

export type AlertsInboxActionKindUrlValue = (typeof ALERTS_INBOX_ACTION_KIND_OPTIONS)[number];

const ALERTS_INBOX_ACTION_KIND_IDS = new Set<string>(ALERTS_INBOX_ACTION_KIND_OPTIONS);

export type AlertsInboxBatchSelectionUrlState = {
  readonly bulkAlertIds: readonly string[];
  readonly actionLoopAlertId: string | null;
  readonly pendingActionAlertId: string | null;
  readonly pendingActionKind: AlertsInboxActionKindUrlValue | null;
};

export function parseAlertsInboxBulkSelectionFromSearch(raw: string | null | undefined): readonly string[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return [];
  }

  return trimmed
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function parseAlertsInboxActionLoopIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAlertsInboxActionAlertIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAlertsInboxActionKindFromSearch(
  raw: string | null | undefined,
): AlertsInboxActionKindUrlValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!ALERTS_INBOX_ACTION_KIND_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as AlertsInboxActionKindUrlValue;
}

export function alertsInboxBatchSelectionHrefFromSearch(
  currentSearch: string,
  state: AlertsInboxBatchSelectionUrlState,
  pathname: string = GOVERNANCE_ALERTS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const bulkIds = state.bulkAlertIds.map((id) => id.trim()).filter((id) => id.length > 0);
  const loopId = (state.actionLoopAlertId ?? "").trim();
  const actionAlertId = (state.pendingActionAlertId ?? "").trim();
  const actionKind = state.pendingActionKind;

  if (bulkIds.length === 0) {
    params.delete(ALERTS_INBOX_BULK_PARAM);
  } else {
    params.set(ALERTS_INBOX_BULK_PARAM, bulkIds.join(","));
  }

  if (loopId.length === 0) {
    params.delete(ALERTS_INBOX_LOOP_PARAM);
  } else {
    params.set(ALERTS_INBOX_LOOP_PARAM, loopId);
  }

  if (actionAlertId.length === 0 || actionKind === null) {
    params.delete(ALERTS_INBOX_ACTION_ALERT_PARAM);
    params.delete(ALERTS_INBOX_ACTION_KIND_PARAM);
  } else {
    params.set(ALERTS_INBOX_ACTION_ALERT_PARAM, actionAlertId);
    params.set(ALERTS_INBOX_ACTION_KIND_PARAM, actionKind);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
