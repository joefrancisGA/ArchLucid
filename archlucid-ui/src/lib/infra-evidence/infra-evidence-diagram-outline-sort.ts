import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import {
  resolveInfraEvidenceOutlineEdgeLabel,
  resolveInfraEvidenceOutlineNodeLabel,
  type InfraEvidenceMermaidOutlineEdge,
  type InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type InfraEvidenceDiagramOutlineNodeSortKey = "label" | "resourceType" | "resourceGroup";

export type InfraEvidenceDiagramOutlineEdgeSortKey = "from" | "relationship" | "to";

export type InfraEvidenceDiagramOutlineNodeSortDir = "asc" | "desc";

export type InfraEvidenceDiagramOutlineEdgeSortDir = InfraEvidenceDiagramOutlineNodeSortDir;

export const DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_KEY: InfraEvidenceDiagramOutlineNodeSortKey = "label";

export const DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_NODE_SORT_DIR: InfraEvidenceDiagramOutlineNodeSortDir = "asc";

export const DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_EDGE_SORT_KEY: InfraEvidenceDiagramOutlineEdgeSortKey = "from";

export const DEFAULT_INFRA_EVIDENCE_DIAGRAM_OUTLINE_EDGE_SORT_DIR: InfraEvidenceDiagramOutlineEdgeSortDir = "asc";

function compareStrings(left: string | null | undefined, right: string | null | undefined): number {
  return (left ?? "").localeCompare(right ?? "", undefined, { sensitivity: "base" });
}

function resourceTypeSortValue(resourceType: string | null | undefined): string {
  return formatDiagramArmTypeFriendlyName(resourceType) ?? resourceType ?? "";
}

function toggleInfraEvidenceDiagramOutlineSort<TSortKey extends string>(
  currentSortKey: TSortKey,
  currentSortDir: InfraEvidenceDiagramOutlineNodeSortDir,
  nextSortKey: TSortKey,
): {
  readonly sortKey: TSortKey;
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

function sortDirectionForInfraEvidenceDiagramOutlineColumn<TSortKey extends string>(
  sortKey: TSortKey,
  column: TSortKey,
  sortDir: InfraEvidenceDiagramOutlineNodeSortDir,
): "ascending" | "descending" | "none" {
  if (sortKey !== column) {
    return "none";
  }

  return sortDir === "asc" ? "ascending" : "descending";
}

export function toggleInfraEvidenceDiagramOutlineNodeSort(
  currentSortKey: InfraEvidenceDiagramOutlineNodeSortKey,
  currentSortDir: InfraEvidenceDiagramOutlineNodeSortDir,
  nextSortKey: InfraEvidenceDiagramOutlineNodeSortKey,
): {
  readonly sortKey: InfraEvidenceDiagramOutlineNodeSortKey;
  readonly sortDir: InfraEvidenceDiagramOutlineNodeSortDir;
} {
  return toggleInfraEvidenceDiagramOutlineSort(currentSortKey, currentSortDir, nextSortKey);
}

export function toggleInfraEvidenceDiagramOutlineEdgeSort(
  currentSortKey: InfraEvidenceDiagramOutlineEdgeSortKey,
  currentSortDir: InfraEvidenceDiagramOutlineEdgeSortDir,
  nextSortKey: InfraEvidenceDiagramOutlineEdgeSortKey,
): {
  readonly sortKey: InfraEvidenceDiagramOutlineEdgeSortKey;
  readonly sortDir: InfraEvidenceDiagramOutlineEdgeSortDir;
} {
  return toggleInfraEvidenceDiagramOutlineSort(currentSortKey, currentSortDir, nextSortKey);
}

export function sortDirectionForInfraEvidenceDiagramOutlineNodeColumn(
  sortKey: InfraEvidenceDiagramOutlineNodeSortKey,
  column: InfraEvidenceDiagramOutlineNodeSortKey,
  sortDir: InfraEvidenceDiagramOutlineNodeSortDir,
): "ascending" | "descending" | "none" {
  return sortDirectionForInfraEvidenceDiagramOutlineColumn(sortKey, column, sortDir);
}

export function sortDirectionForInfraEvidenceDiagramOutlineEdgeColumn(
  sortKey: InfraEvidenceDiagramOutlineEdgeSortKey,
  column: InfraEvidenceDiagramOutlineEdgeSortKey,
  sortDir: InfraEvidenceDiagramOutlineEdgeSortDir,
): "ascending" | "descending" | "none" {
  return sortDirectionForInfraEvidenceDiagramOutlineColumn(sortKey, column, sortDir);
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
        result = compareStrings(resourceTypeSortValue(left.resourceType), resourceTypeSortValue(right.resourceType));

        if (result === 0) {
          result = compareStrings(left.resourceType, right.resourceType);
        }

        break;

      case "resourceGroup":
        result = compareStrings(left.resourceGroup, right.resourceGroup);
        break;

      default: {
        const exhaustive: never = sortKey;
        throw new Error(`Unhandled diagram outline sort key: ${String(exhaustive)}`);
      }
    }

    if (result === 0) {
      result = compareStrings(left.id, right.id);
    }

    return result * direction;
  });

  return sorted;
}

function edgeSortValue(
  edge: InfraEvidenceMermaidOutlineEdge,
  nodes: readonly InfraEvidenceMermaidOutlineNode[],
  sortKey: InfraEvidenceDiagramOutlineEdgeSortKey,
): string {
  switch (sortKey) {
    case "from":
      return resolveInfraEvidenceOutlineNodeLabel(nodes, edge.from);

    case "relationship":
      return resolveInfraEvidenceOutlineEdgeLabel(edge, nodes);

    case "to":
      return resolveInfraEvidenceOutlineNodeLabel(nodes, edge.to);

    default: {
      const exhaustive: never = sortKey;
      throw new Error(`Unhandled diagram outline edge sort key: ${String(exhaustive)}`);
    }
  }
}

export function sortInfraEvidenceDiagramOutlineEdges(
  edges: readonly InfraEvidenceMermaidOutlineEdge[],
  nodes: readonly InfraEvidenceMermaidOutlineNode[],
  sortKey: InfraEvidenceDiagramOutlineEdgeSortKey,
  sortDir: InfraEvidenceDiagramOutlineEdgeSortDir,
): InfraEvidenceMermaidOutlineEdge[] {
  const direction = sortDir === "desc" ? -1 : 1;
  const sorted = [...edges];

  sorted.sort((left, right) => {
    let result = compareStrings(edgeSortValue(left, nodes, sortKey), edgeSortValue(right, nodes, sortKey));

    if (result === 0) {
      result = compareStrings(left.from, right.from);
    }

    if (result === 0) {
      result = compareStrings(left.to, right.to);
    }

    return result * direction;
  });

  return sorted;
}
