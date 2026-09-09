export const AUDIT_TIMELINE_TECHNICAL_DETAILS_EVENT_ID_PARAM = "auditTimelineTechnicalDetailsEventId";

export function parseAuditTimelineTechnicalDetailsEventIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function auditTimelineTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  eventId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (eventId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(AUDIT_TIMELINE_TECHNICAL_DETAILS_EVENT_ID_PARAM);
  } else {
    params.set(AUDIT_TIMELINE_TECHNICAL_DETAILS_EVENT_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
