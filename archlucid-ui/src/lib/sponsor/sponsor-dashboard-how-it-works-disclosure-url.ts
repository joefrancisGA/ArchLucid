import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SPONSOR_DASHBOARD_HOW_IT_WORKS_OPEN_PARAM = "sponsorDashboardHowItWorksOpen";

export function parseSponsorDashboardHowItWorksOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function sponsorDashboardHowItWorksDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SPONSOR_DASHBOARD_HOW_IT_WORKS_OPEN_PARAM);
}
