import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_CAIQ_SIG_RESPONSE_SOURCES_OPEN_PARAM = "helpCaiqSigResponseSourcesOpen";

export function parseHelpCaiqSigResponseSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpCaiqSigResponseSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_CAIQ_SIG_RESPONSE_SOURCES_OPEN_PARAM);
}
