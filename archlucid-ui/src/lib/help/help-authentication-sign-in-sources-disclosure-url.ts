import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_AUTHENTICATION_SIGN_IN_SOURCES_OPEN_PARAM);
}
