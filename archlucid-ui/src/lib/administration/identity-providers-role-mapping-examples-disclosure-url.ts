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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_OPEN_PARAM);
  } else {
    params.set(IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
