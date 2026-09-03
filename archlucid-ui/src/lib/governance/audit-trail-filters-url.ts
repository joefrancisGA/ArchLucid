import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const AUDIT_TRAIL_ACTION_PARAM = "action";
export const AUDIT_TRAIL_ACTOR_PARAM = "actor";
export const AUDIT_TRAIL_SEARCH_PARAM = "q";

export function parseAuditTrailActionFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseAuditTrailActorFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseAuditTrailSearchQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function auditTrailActionHrefFromSearch(
  currentSearch: string,
  action: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = action.trim();

  if (trimmed.length === 0) {
    params.delete(AUDIT_TRAIL_ACTION_PARAM);
  } else {
    params.set(AUDIT_TRAIL_ACTION_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function auditTrailActorHrefFromSearch(
  currentSearch: string,
  actor: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = actor.trim();

  if (trimmed.length === 0) {
    params.delete(AUDIT_TRAIL_ACTOR_PARAM);
  } else {
    params.set(AUDIT_TRAIL_ACTOR_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function auditTrailSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(AUDIT_TRAIL_SEARCH_PARAM);
  } else {
    params.set(AUDIT_TRAIL_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function auditTrailClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  return auditTrailSearchHrefFromSearch(currentSearch, "", pathname);
}

export function auditTrailClearFiltersHrefFromSearch(
  currentSearch: string,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  params.delete(AUDIT_TRAIL_ACTION_PARAM);
  params.delete(AUDIT_TRAIL_ACTOR_PARAM);
  params.delete(AUDIT_TRAIL_SEARCH_PARAM);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
