export const AUDIT_TIMELINE_DATA_JSON_EVENT_ID_PARAM = "auditTimelineDataJsonEventId";

export function parseAuditTimelineDataJsonEventIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function auditTimelineDataJsonDisclosureHrefFromSearch(
  currentSearch: string,
  eventId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (eventId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(AUDIT_TIMELINE_DATA_JSON_EVENT_ID_PARAM);
  } else {
    params.set(AUDIT_TIMELINE_DATA_JSON_EVENT_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
