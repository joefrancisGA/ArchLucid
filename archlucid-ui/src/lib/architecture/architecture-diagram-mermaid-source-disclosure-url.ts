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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_OPEN_PARAM);
  } else {
    params.set(ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
