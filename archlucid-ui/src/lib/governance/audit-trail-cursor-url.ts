import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const AUDIT_TRAIL_CURSOR_PARAM = "cursor";

export function parseAuditTrailCursorFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function auditTrailCursorHrefFromSearch(
  currentSearch: string,
  cursor: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = cursor.trim();

    if (trimmed.length === 0) {
      params.delete(AUDIT_TRAIL_CURSOR_PARAM);
    } else {
      params.set(AUDIT_TRAIL_CURSOR_PARAM, trimmed);
    }
    },
  });
}
