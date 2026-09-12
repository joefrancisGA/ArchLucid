import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type InfraEvidenceDiagramOutlineNodeSortKey = "label" | "resourceType" | "resourceGroup";

export type InfraEvidenceDiagramOutlineNodeSortDir = "asc" | "desc";

export const DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_KEY: InfraEvidenceDiagramOutlineNodeSortKey = "label";

export const DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_DIR: InfraEvidenceDiagramOutlineNodeSortDir = "asc";

function compareStrings(left: string | null | undefined, right: string | null | undefined): number {
  return (left ?? "").localeCompare(right ?? "", undefined, { sensitivity: "base" });
}

export function toggleInfraEvidenceDiagramOutlineNodeSort(
  currentSortKey: InfraEvidenceDiagramOutlineNodeSortKey,
  currentSortDir: InfraEvidenceDiagramOutlineNodeSortDir,
  nextSortKey: InfraEvidenceDiagramOutlineNodeSortKey,
): {
  readonly sortKey: InfraEvidenceDiagramOutlineNodeSortKey;
  readonly sortDir: InfraEvidenceDiagramOutlineNodeSortDir;
} {
  if (currentSortKey === nextSortKey) {
    return {
      sortKey: nextSortKey,
      sortDir: currentSortDir === "asc" ? "desc" : "asc",
    };
  }

  return {
    sortKey: nextSortKey,
    sortDir: "asc",
  };
}

export function sortDirectionForInfraEvidenceDiagramOutlineNodeColumn(
  sortKey: InfraEvidenceDiagramOutlineNodeSortKey,
  column: InfraEvidenceDiagramOutlineNodeSortKey,
  sortDir: InfraEvidenceDiagramOutlineNodeSortDir,
): "ascending" | "descending" | "none" {
  if (sortKey !== column) {
    return "none";
  }

  return sortDir === "asc" ? "ascending" : "descending";
}

export function sortInfraEvidenceDiagramOutlineNodes(
  nodes: readonly InfraEvidenceMermaidOutlineNode[],
  sortKey: InfraEvidenceDiagramOutlineNodeSortKey,
  sortDir: InfraEvidenceDiagramOutlineNodeSortDir,
): InfraEvidenceMermaidOutlineNode[] {
  const direction = sortDir === "desc" ? -1 : 1;
  const sorted = [...nodes];

  sorted.sort((left, right) => {
    let result = 0;

    switch (sortKey) {
      case "label":
        result = compareStrings(left.label, right.label);
        break;

      case "resourceType":
        result = compareStrings(left.resourceType, right.resourceType);
        break;

      case "resourceGroup":
        result = compareStrings(left.resourceGroup, right.resourceGroup);
        break;
    }

    if (result === 0) {
      result = compareStrings(left.id, right.id);
    }

    return result * direction;
  });

  return sorted;
}
