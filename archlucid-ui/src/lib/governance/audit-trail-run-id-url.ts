import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const AUDIT_TRAIL_RUN_ID_PARAM = "runId";

export function parseAuditTrailRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function auditTrailRunIdHrefFromSearch(
  currentSearch: string,
  runId: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    params.delete(AUDIT_TRAIL_RUN_ID_PARAM);
  } else {
    params.set(AUDIT_TRAIL_RUN_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
