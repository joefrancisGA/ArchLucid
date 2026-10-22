import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const ALERTS_INBOX_CURSOR_PARAM = "cursor";

export function parseAlertsInboxCursorFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function alertsInboxCursorHrefFromSearch(currentSearch: string, cursor: string): string {
  return buildOperatorHrefFromSearch(currentSearch, GOVERNANCE_ALERTS_PATH, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = cursor.trim();

    if (trimmed.length === 0) {
      params.delete(ALERTS_INBOX_CURSOR_PARAM);
    } else {
      params.set(ALERTS_INBOX_CURSOR_PARAM, trimmed);
    }
    },
  });
}
