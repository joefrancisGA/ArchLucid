import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const POLICY_PACK_TECHNICAL_DETAILS_OPEN_PARAM = "policyPackTechnicalDetailsOpen";

export function parsePolicyPackTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function policyPackTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, POLICY_PACK_TECHNICAL_DETAILS_OPEN_PARAM);
}
