import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const CLOUD_SECURITY_PREFLIGHT_TECHNICAL_DETAILS_OPEN_PARAM = "cloudSecurityPreflightTechnicalDetailsOpen";

export function parseCloudSecurityPreflightTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function cloudSecurityPreflightTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, CLOUD_SECURITY_PREFLIGHT_TECHNICAL_DETAILS_OPEN_PARAM);
}
