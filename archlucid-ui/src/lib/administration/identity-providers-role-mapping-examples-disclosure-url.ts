import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_OPEN_PARAM = "identityProvidersRoleMappingExamplesOpen";

export function parseIdentityProvidersRoleMappingExamplesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function identityProvidersRoleMappingExamplesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_OPEN_PARAM);
}
