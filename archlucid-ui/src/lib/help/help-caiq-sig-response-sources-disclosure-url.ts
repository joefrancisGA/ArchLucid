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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_CAIQ_SIG_RESPONSE_SOURCES_OPEN_PARAM);
  } else {
    params.set(HELP_CAIQ_SIG_RESPONSE_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
