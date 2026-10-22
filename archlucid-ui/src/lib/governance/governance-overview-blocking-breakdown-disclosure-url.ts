import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GOVERNANCE_OVERVIEW_BLOCKING_BREAKDOWN_OPEN_PARAM);
}
