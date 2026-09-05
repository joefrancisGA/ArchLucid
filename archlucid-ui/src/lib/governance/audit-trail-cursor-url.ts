import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

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
  const params = new URLSearchParams(currentSearch);
  const trimmed = cursor.trim();

  if (trimmed.length === 0) {
    params.delete(AUDIT_TRAIL_CURSOR_PARAM);
  } else {
    params.set(AUDIT_TRAIL_CURSOR_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
