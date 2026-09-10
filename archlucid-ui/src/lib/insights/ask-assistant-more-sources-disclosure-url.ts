export const ASK_ASSISTANT_MORE_SOURCES_OPEN_PARAM = "askAssistantMoreSourcesOpen";

export function parseAskAssistantMoreSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function askAssistantMoreSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ASK_ASSISTANT_MORE_SOURCES_OPEN_PARAM);
  } else {
    params.set(ASK_ASSISTANT_MORE_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
