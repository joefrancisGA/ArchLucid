import type { Edge, Node } from "reactflow";

import type { GraphViewModel } from "@/types/graph";

export type FindingEvidenceGraphViewMode = "context" | "evidenceOnly";

const TEAL_HIGHLIGHT = "#0d9488";
const TEAL_HIGHLIGHT_FILL = "#ccfbf1";
const DIM_OPACITY = 0.38;

function normalizeNodeId(value: string): string {
  return value.trim().toLowerCase();
}

export function buildExaminedNodeIdSet(graphNodeIdsExamined: readonly string[]): ReadonlySet<string> {
  const examined = new Set<string>();

  for (const nodeId of graphNodeIdsExamined) {
    if (nodeId.trim().length > 0) {
      examined.add(normalizeNodeId(nodeId));
    }
  }

  return examined;
}

export function isGraphNodeExamined(nodeId: string, examinedIds: ReadonlySet<string>): boolean {
  return examinedIds.has(normalizeNodeId(nodeId));
}

function filterGraphToExaminedSubgraph(
  graph: GraphViewModel,
  examinedIds: ReadonlySet<string>,
): GraphViewModel {
  const nodes = graph.nodes.filter((node) => isGraphNodeExamined(node.id, examinedIds));
  const nodeIds = new Set(nodes.map((node) => node.id));

  const edges = graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  return {
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

export function resolveFindingEvidenceGraphViewModel(
  graph: GraphViewModel,
  graphNodeIdsExamined: readonly string[],
  viewMode: FindingEvidenceGraphViewMode,
): GraphViewModel {
  const examinedIds = buildExaminedNodeIdSet(graphNodeIdsExamined);

  if (viewMode === "evidenceOnly") {
    return filterGraphToExaminedSubgraph(graph, examinedIds);
  }

  return graph;
}

export function applyFindingEvidenceGraphHighlight(
  nodes: Node[],
  edges: Edge[],
  graphNodeIdsExamined: readonly string[],
  viewMode: FindingEvidenceGraphViewMode,
): { nodes: Node[]; edges: Edge[] } {
  const examinedIds = buildExaminedNodeIdSet(graphNodeIdsExamined);

  const highlightedNodes = nodes.map((node) => {
    const examined = isGraphNodeExamined(node.id, examinedIds);
    const baseStyle = node.style ?? {};

    if (viewMode === "evidenceOnly") {
      return {
        ...node,
        style: {
          ...baseStyle,
          opacity: 1,
          border: `3px solid ${TEAL_HIGHLIGHT}`,
          boxShadow: "0 0 0 2px rgba(13, 148, 136, 0.25)",
          background: TEAL_HIGHLIGHT_FILL,
        },
      };
    }

    if (examined) {
      return {
        ...node,
        style: {
          ...baseStyle,
          opacity: 1,
          border: `3px solid ${TEAL_HIGHLIGHT}`,
          boxShadow: "0 0 0 2px rgba(13, 148, 136, 0.25)",
          background: TEAL_HIGHLIGHT_FILL,
          fontWeight: 600,
        },
      };
    }

    return {
      ...node,
      style: {
        ...baseStyle,
        opacity: DIM_OPACITY,
      },
    };
  });

  const highlightedEdges = edges.map((edge) => {
    const sourceExamined = isGraphNodeExamined(edge.source, examinedIds);
    const targetExamined = isGraphNodeExamined(edge.target, examinedIds);
    const onEvidencePath =
      viewMode === "evidenceOnly" ? true : sourceExamined && targetExamined;

    return {
      ...edge,
      animated: onEvidencePath,
      style: {
        ...(edge.style ?? {}),
        stroke: onEvidencePath ? TEAL_HIGHLIGHT : "#cbd5e1",
        strokeWidth: onEvidencePath ? 2.5 : 1,
        opacity: viewMode === "evidenceOnly" || onEvidencePath ? 1 : DIM_OPACITY,
      },
    };
  });

  return { nodes: highlightedNodes, edges: highlightedEdges };
}

/** Prefer evidence-only layout when the full graph is large but evidence footprint is small. */
export function defaultFindingEvidenceGraphViewMode(
  totalNodeCount: number,
  examinedCount: number,
): FindingEvidenceGraphViewMode {
  if (examinedCount === 0) {
    return "context";
  }

  if (totalNodeCount > 48 && examinedCount <= 12) {
    return "evidenceOnly";
  }

  return "context";
}
