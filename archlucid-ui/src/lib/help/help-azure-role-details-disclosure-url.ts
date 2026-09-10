export const HELP_AZURE_ROLE_DETAILS_KEY_PARAM = "helpAzureRoleDetailsKey";

export function parseHelpAzureRoleDetailsKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpAzureRoleDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  roleKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (roleKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_AZURE_ROLE_DETAILS_KEY_PARAM);
  } else {
    params.set(HELP_AZURE_ROLE_DETAILS_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
