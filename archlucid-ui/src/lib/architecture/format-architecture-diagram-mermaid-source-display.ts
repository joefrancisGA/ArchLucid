export const ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_NOT_STORED = "Mermaid source was not stored." as const;

export const ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_STORED_EMPTY = "Mermaid source was stored empty." as const;

export const INVENTORY_DIAGRAM_MERMAID_STORED_EMPTY = "Inventory diagram Mermaid was stored empty." as const;

/** True when generated mermaid is only the flowchart header with no nodes. */
export function isStoredEmptyInventoryDiagramMermaid(source: string | null | undefined): boolean {
  const trimmed = source?.trim() ?? "";

  if (trimmed.length === 0) {
    return false;
  }

  const normalized = trimmed.replace(/\s+/g, " ").toLowerCase();

  return normalized === "flowchart tb" || normalized === "flowchart tb;";
}

export function formatArchitectureDiagramMermaidSourceForDisclosure(
  source: string | null | undefined,
): string {
  if (source === null || source === undefined) {
    return ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_NOT_STORED;
  }

  if (source.trim().length === 0) {
    return ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_STORED_EMPTY;
  }

  if (isStoredEmptyInventoryDiagramMermaid(source)) {
    return INVENTORY_DIAGRAM_MERMAID_STORED_EMPTY;
  }

  return source;
}
