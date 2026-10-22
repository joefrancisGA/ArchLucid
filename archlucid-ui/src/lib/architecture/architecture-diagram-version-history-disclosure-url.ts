import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ARCHITECTURE_DIAGRAM_VERSION_HISTORY_OPEN_PARAM = "architectureDiagramVersionHistoryOpen";

export function parseArchitectureDiagramVersionHistoryOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureDiagramVersionHistoryDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ARCHITECTURE_DIAGRAM_VERSION_HISTORY_OPEN_PARAM);
}
