export const HELP_AUTHENTICATION_SIGN_IN_SOURCES_OPEN_PARAM = "helpAuthenticationSignInSourcesOpen";

export function parseHelpAuthenticationSignInSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpAuthenticationSignInSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_AUTHENTICATION_SIGN_IN_SOURCES_OPEN_PARAM);
  } else {
    params.set(HELP_AUTHENTICATION_SIGN_IN_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
