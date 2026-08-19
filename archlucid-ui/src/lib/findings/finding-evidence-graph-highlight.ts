import type { CSSProperties } from "react";
import type { Edge, Node } from "reactflow";

import type { GraphViewModel } from "@/types/graph";

/**
 * `reasoningPath` shows the examined nodes plus whatever connects directly to them, which is the
 * chain a reader needs to follow the finding. `context` shows the whole architecture graph.
 *
 * Examined nodes alone are not useful as a default: a finding with a single examined node would
 * render as one isolated box with no reasoning to read.
 */
export type FindingEvidenceGraphViewMode = "context" | "reasoningPath";

const TEAL_HIGHLIGHT = "#0d9488";
const TEAL_HIGHLIGHT_FILL = "#ccfbf1";
const DIM_OPACITY = 0.38;
const NEIGHBOR_OPACITY = 0.75;

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

/** Examined nodes plus every node one edge away from them. */
export function buildReasoningPathNodeIdSet(
  graph: GraphViewModel,
  examinedIds: ReadonlySet<string>,
): ReadonlySet<string> {
  const included = new Set<string>(
    graph.nodes.filter((node) => isGraphNodeExamined(node.id, examinedIds)).map((node) => node.id),
  );

  for (const edge of graph.edges) {
    if (isGraphNodeExamined(edge.source, examinedIds)) {
      included.add(edge.target);
    }

    if (isGraphNodeExamined(edge.target, examinedIds)) {
      included.add(edge.source);
    }
  }

  return included;
}

function filterGraphToReasoningPath(
  graph: GraphViewModel,
  examinedIds: ReadonlySet<string>,
): GraphViewModel {
  const includedIds = buildReasoningPathNodeIdSet(graph, examinedIds);

  const nodes = graph.nodes.filter((node) => includedIds.has(node.id));
  const edges = graph.edges.filter((edge) => includedIds.has(edge.source) && includedIds.has(edge.target));

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

  if (viewMode === "reasoningPath") {
    return filterGraphToReasoningPath(graph, examinedIds);
  }

  return graph;
}

function examinedNodeStyle(baseStyle: CSSProperties): CSSProperties {
  return {
    ...baseStyle,
    opacity: 1,
    border: `3px solid ${TEAL_HIGHLIGHT}`,
    boxShadow: "0 0 0 2px rgba(13, 148, 136, 0.25)",
    background: TEAL_HIGHLIGHT_FILL,
    fontWeight: 600,
  };
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

    if (examined) {
      return { ...node, style: examinedNodeStyle(baseStyle) };
    }

    // Surrounding nodes stay legible on the reasoning path, but recede on the full-context view.
    return {
      ...node,
      style: {
        ...baseStyle,
        opacity: viewMode === "reasoningPath" ? NEIGHBOR_OPACITY : DIM_OPACITY,
      },
    };
  });

  const highlightedEdges = edges.map((edge) => {
    const sourceExamined = isGraphNodeExamined(edge.source, examinedIds);
    const targetExamined = isGraphNodeExamined(edge.target, examinedIds);
    const onEvidencePath =
      viewMode === "reasoningPath" ? sourceExamined || targetExamined : sourceExamined && targetExamined;

    return {
      ...edge,
      animated: onEvidencePath,
      style: {
        ...(edge.style ?? {}),
        stroke: onEvidencePath ? TEAL_HIGHLIGHT : "#cbd5e1",
        strokeWidth: onEvidencePath ? 2.5 : 1,
        opacity: onEvidencePath ? 1 : viewMode === "reasoningPath" ? NEIGHBOR_OPACITY : DIM_OPACITY,
      },
    };
  });

  return { nodes: highlightedNodes, edges: highlightedEdges };
}

/**
 * Open on the reasoning path whenever there is one: it answers the question the reader arrived with.
 * Full context is one click away and stays the default only when nothing was examined.
 */
export function defaultFindingEvidenceGraphViewMode(
  examinedCount: number,
): FindingEvidenceGraphViewMode {
  if (examinedCount === 0) {
    return "context";
  }

  return "reasoningPath";
}
