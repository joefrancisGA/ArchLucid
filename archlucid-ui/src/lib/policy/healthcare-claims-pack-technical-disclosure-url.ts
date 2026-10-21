import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HEALTHCARE_CLAIMS_PACK_TECHNICAL_OPEN_PARAM = "healthcareClaimsPackTechnicalOpen";

export function parseHealthcareClaimsPackTechnicalOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function healthcareClaimsPackTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HEALTHCARE_CLAIMS_PACK_TECHNICAL_OPEN_PARAM);
}
