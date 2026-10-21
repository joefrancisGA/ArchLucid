import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_IMPACT_ANALYSIS_OPEN_PARAM = "runImpactAnalysisOpen";

export function parseRunImpactAnalysisOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runImpactAnalysisDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_IMPACT_ANALYSIS_OPEN_PARAM);
}
