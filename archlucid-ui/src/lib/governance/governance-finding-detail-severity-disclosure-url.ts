import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GOVERNANCE_FINDING_DETAIL_SEVERITY_OPEN_PARAM = "governanceFindingDetailSeverityOpen";

export function parseGovernanceFindingDetailSeverityOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function governanceFindingDetailSeverityDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GOVERNANCE_FINDING_DETAIL_SEVERITY_OPEN_PARAM);
}
