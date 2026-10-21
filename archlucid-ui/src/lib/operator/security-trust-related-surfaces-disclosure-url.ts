import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SECURITY_TRUST_RELATED_SURFACES_OPEN_PARAM = "securityTrustRelatedSurfacesOpen";

export function parseSecurityTrustRelatedSurfacesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function securityTrustRelatedSurfacesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SECURITY_TRUST_RELATED_SURFACES_OPEN_PARAM);
}
