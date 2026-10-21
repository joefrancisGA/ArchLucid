import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const IDENTITY_PROVIDERS_TECHNICAL_DETAILS_OPEN_PARAM = "identityProvidersTechnicalDetailsOpen";

export function parseIdentityProvidersTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function identityProvidersTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, IDENTITY_PROVIDERS_TECHNICAL_DETAILS_OPEN_PARAM);
}
