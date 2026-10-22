import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const INFRA_REMEDIATION_VERIFY_HINT_DISCLOSURE_OPEN_PARAM = "infraRemediationVerifyHintDisclosureOpen";

export function parseInfraRemediationVerifyHintDisclosureOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function infraRemediationVerifyHintDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, INFRA_REMEDIATION_VERIFY_HINT_DISCLOSURE_OPEN_PARAM);
}
