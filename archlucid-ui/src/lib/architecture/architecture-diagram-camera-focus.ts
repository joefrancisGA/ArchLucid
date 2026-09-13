import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export function resolveDiagramCameraFocusNodeIds(
  seedId: string | null | undefined,
  outline: InfraEvidenceMermaidOutline | null | undefined,
): readonly string[] {
  const seed = seedId?.trim() ?? "";

  if (seed.length === 0 || outline == null) {
    return [];
  }

  const nodeIds = new Set<string>([seed]);

  for (const edge of outline.edges) {
    if (edge.from === seed) {
      nodeIds.add(edge.to);
    }

    if (edge.to === seed) {
      nodeIds.add(edge.from);
    }
  }

  return [...nodeIds];
}

export function inventoryDiagramNodeElementMatchesFocusId(
  element: Element,
  focusNodeIds: readonly string[],
): boolean {
  if (focusNodeIds.length === 0) {
    return false;
  }

  const id = element.getAttribute("id") ?? "";
  const title = element.querySelector("title")?.textContent?.trim() ?? "";

  for (const focusId of focusNodeIds) {
    const trimmed = focusId.trim();

    if (trimmed.length === 0) {
      continue;
    }

    if (id.includes(trimmed) || title.includes(trimmed)) {
      return true;
    }

    const normalizedFocus = normalizeDiagramFocusToken(trimmed);
    const normalizedId = normalizeDiagramFocusToken(id);
    const normalizedTitle = normalizeDiagramFocusToken(title);

    if (
      normalizedFocus.length > 0
      && (normalizedId.includes(normalizedFocus) || normalizedTitle.includes(normalizedFocus))
    ) {
      return true;
    }
  }

  return false;
}

function normalizeDiagramFocusToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
