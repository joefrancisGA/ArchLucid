import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SPONSOR_DASHBOARD_SUPPORTING_METRICS_OPEN_PARAM = "sponsorDashboardSupportingMetricsOpen";

export function parseSponsorDashboardSupportingMetricsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function sponsorDashboardSupportingMetricsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SPONSOR_DASHBOARD_SUPPORTING_METRICS_OPEN_PARAM);
}
