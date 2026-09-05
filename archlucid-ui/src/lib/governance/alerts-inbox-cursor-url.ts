import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";

export const ALERTS_INBOX_CURSOR_PARAM = "cursor";

export function parseAlertsInboxCursorFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function alertsInboxCursorHrefFromSearch(currentSearch: string, cursor: string): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = cursor.trim();

  if (trimmed.length === 0) {
    params.delete(ALERTS_INBOX_CURSOR_PARAM);
  } else {
    params.set(ALERTS_INBOX_CURSOR_PARAM, trimmed);
  }

  const query = params.toString();

  return query.length === 0 ? GOVERNANCE_ALERTS_PATH : `${GOVERNANCE_ALERTS_PATH}?${query}`;
}
