import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const AUDIT_TRAIL_FROM_PARAM = "from";
export const AUDIT_TRAIL_TO_PARAM = "to";

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseAuditTrailCustomDateFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (!DATETIME_LOCAL_PATTERN.test(trimmed)) {
    return "";
  }

  return trimmed;
}

export function auditTrailCustomDateHrefFromSearch(
  currentSearch: string,
  fromUtc: string,
  toUtc: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const from = parseAuditTrailCustomDateFromSearch(fromUtc);
  const to = parseAuditTrailCustomDateFromSearch(toUtc);

  if (from.length === 0) {
    params.delete(AUDIT_TRAIL_FROM_PARAM);
  } else {
    params.set(AUDIT_TRAIL_FROM_PARAM, from);
  }

  if (to.length === 0) {
    params.delete(AUDIT_TRAIL_TO_PARAM);
  } else {
    params.set(AUDIT_TRAIL_TO_PARAM, to);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
