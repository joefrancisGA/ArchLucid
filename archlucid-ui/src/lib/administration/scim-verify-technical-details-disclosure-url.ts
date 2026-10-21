import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SCIM_VERIFY_TECHNICAL_DETAILS_OPEN_PARAM = "scimVerifyTechnicalDetailsOpen";

export function parseScimVerifyTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function scimVerifyTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SCIM_VERIFY_TECHNICAL_DETAILS_OPEN_PARAM);
}
