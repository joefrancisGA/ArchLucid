import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_DETAIL_ACTIVITY_OUTCOME_METRICS_OPEN_PARAM = "runDetailActivityOutcomeMetricsOpen";

export function parseRunDetailActivityOutcomeMetricsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runDetailActivityOutcomeMetricsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_DETAIL_ACTIVITY_OUTCOME_METRICS_OPEN_PARAM);
}
