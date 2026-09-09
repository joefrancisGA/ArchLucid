export const GOVERNANCE_OVERVIEW_BLOCKING_BREAKDOWN_OPEN_PARAM = "governanceOverviewBlockingBreakdownOpen";

export function parseGovernanceOverviewBlockingBreakdownOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function governanceOverviewBlockingBreakdownDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(GOVERNANCE_OVERVIEW_BLOCKING_BREAKDOWN_OPEN_PARAM);
  } else {
    params.set(GOVERNANCE_OVERVIEW_BLOCKING_BREAKDOWN_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
