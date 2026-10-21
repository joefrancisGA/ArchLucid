import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ASK_ASSISTANT_MORE_SOURCES_OPEN_PARAM);
}
