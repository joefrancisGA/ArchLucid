import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const INFRA_REMEDIATION_FINDING_ID_DISCLOSURE_OPEN_PARAM = "infraRemediationFindingIdDisclosureOpen";

export function parseInfraRemediationFindingIdDisclosureOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function infraRemediationFindingIdDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, INFRA_REMEDIATION_FINDING_ID_DISCLOSURE_OPEN_PARAM);
}
