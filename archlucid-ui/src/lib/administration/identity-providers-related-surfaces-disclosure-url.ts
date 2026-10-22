import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const IDENTITY_PROVIDERS_RELATED_SURFACES_OPEN_PARAM = "identityProvidersRelatedSurfacesOpen";

export function parseIdentityProvidersRelatedSurfacesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function identityProvidersRelatedSurfacesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, IDENTITY_PROVIDERS_RELATED_SURFACES_OPEN_PARAM);
}
