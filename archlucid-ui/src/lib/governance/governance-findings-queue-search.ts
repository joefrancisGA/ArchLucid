import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";

export const GOVERNANCE_FINDINGS_SEARCH_PARAM = "q";
export const GOVERNANCE_FINDINGS_REGISTER_FILTER_PARAM = "filter";

/** Parses `?q=` from the findings queue URL. */
export function parseGovernanceFindingsSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function governanceFindingsSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(GOVERNANCE_FINDINGS_SEARCH_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function governanceFindingsRegisterFilterHrefFromSearch(
  currentSearch: string,
  filter: RiskRegisterFilter,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (filter === "all") {
    params.delete(GOVERNANCE_FINDINGS_REGISTER_FILTER_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_REGISTER_FILTER_PARAM, filter);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

/** Client-side row match for findings queue header/in-page search. */
export function matchesGovernanceFindingsSearchQuery(
  row: GovernanceFindingQueueRow,
  query: string,
): boolean {
  const trimmed = query.trim().toLowerCase();

  if (trimmed.length === 0) {
    return true;
  }

  const haystack = [
    row.title,
    row.runLabel,
    row.findingId,
    row.runId,
    row.severity,
    row.status,
    row.category,
    row.recommended,
    row.systemName,
    row.resourceId,
    row.latestDisposition,
    row.itsmLinkedTicketsSummary,
  ]
    .filter((value) => value !== null && value !== undefined && `${value}`.trim().length > 0)
    .join(" ")
    .toLowerCase();

  return haystack.includes(trimmed);
}
