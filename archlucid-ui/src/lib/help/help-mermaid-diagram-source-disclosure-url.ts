import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_MERMAID_DIAGRAM_SOURCE_OPEN_PARAM = "helpMermaidDiagramSourceOpen";

export function parseHelpMermaidDiagramSourceOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpMermaidDiagramSourceDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_MERMAID_DIAGRAM_SOURCE_OPEN_PARAM);
}
