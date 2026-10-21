import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_OPEN_PARAM = "architectureDiagramMermaidSourceOpen";

export function parseArchitectureDiagramMermaidSourceOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureDiagramMermaidSourceDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_OPEN_PARAM);
}
