import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_SECURITY_TRUST_SOURCES_OPEN_PARAM = "helpSecurityTrustSourcesOpen";

export function parseHelpSecurityTrustSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpSecurityTrustSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_SECURITY_TRUST_SOURCES_OPEN_PARAM);
}
