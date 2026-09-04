import type { ArchitectureDiagramElementKind } from "@/lib/architecture/architecture-diagram-provenance";

export const ARCHITECTURE_DIAGRAM_KIND_PARAM = "diagKind";
export const ARCHITECTURE_DIAGRAM_ID_PARAM = "diagId";
export const ARCHITECTURE_DIAGRAM_EDIT_PARAM = "diagEdit";

const ARCHITECTURE_DIAGRAM_KIND_IDS = new Set<string>(["node", "edge"]);

export type ArchitectureDiagramSelectionUrlState = {
  readonly elementKind: ArchitectureDiagramElementKind | null;
  readonly elementId: string | null;
  readonly editorOpen: boolean;
};

export function parseArchitectureDiagramKindFromSearch(
  raw: string | null | undefined,
): ArchitectureDiagramElementKind | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!ARCHITECTURE_DIAGRAM_KIND_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as ArchitectureDiagramElementKind;
}

export function parseArchitectureDiagramIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseArchitectureDiagramEditOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureDiagramSelectionHrefFromSearch(
  currentSearch: string,
  state: ArchitectureDiagramSelectionUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const elementId = (state.elementId ?? "").trim();

  if (state.elementKind === null || elementId.length === 0) {
    params.delete(ARCHITECTURE_DIAGRAM_KIND_PARAM);
    params.delete(ARCHITECTURE_DIAGRAM_ID_PARAM);
    params.delete(ARCHITECTURE_DIAGRAM_EDIT_PARAM);
  } else {
    params.set(ARCHITECTURE_DIAGRAM_KIND_PARAM, state.elementKind);
    params.set(ARCHITECTURE_DIAGRAM_ID_PARAM, elementId);

    if (!state.editorOpen) {
      params.delete(ARCHITECTURE_DIAGRAM_EDIT_PARAM);
    } else {
      params.set(ARCHITECTURE_DIAGRAM_EDIT_PARAM, "1");
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
