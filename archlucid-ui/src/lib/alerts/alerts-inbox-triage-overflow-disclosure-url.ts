export const ALERTS_INBOX_TRIAGE_OVERFLOW_ALERT_ID_PARAM = "alertsInboxTriageOverflowAlertId";

export function parseAlertsInboxTriageOverflowAlertIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function alertsInboxTriageOverflowDisclosureHrefFromSearch(
  currentSearch: string,
  alertId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (alertId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(ALERTS_INBOX_TRIAGE_OVERFLOW_ALERT_ID_PARAM);
  } else {
    params.set(ALERTS_INBOX_TRIAGE_OVERFLOW_ALERT_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
