import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AUDIT_OPERATOR_TABLE_EVENT_JSON_EVENT_ID_PARAM = "auditOperatorTableEventJsonEventId";

export function parseAuditOperatorTableEventJsonEventIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function auditOperatorTableEventJsonDisclosureHrefFromSearch(
  currentSearch: string,
  eventId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (eventId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(AUDIT_OPERATOR_TABLE_EVENT_JSON_EVENT_ID_PARAM);
    } else {
      params.set(AUDIT_OPERATOR_TABLE_EVENT_JSON_EVENT_ID_PARAM, trimmed);
    }
    },
  });
}
