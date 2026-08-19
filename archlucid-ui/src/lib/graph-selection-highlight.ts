import type { Edge, Node } from "reactflow";

/** Soften unselected graph elements so the focus node stays readable. */
export const GRAPH_SELECTION_DIM_OPACITY = 0.34;

const SELECTED_BORDER = "#0f766e";
const NEIGHBOR_BORDER = "#0d9488";

/**
 * Dim nodes/edges that are not the selection or an immediate neighbor.
 * Keeps the graph scannable without hiding structure entirely.
 */
export function applyGraphSelectionFocus(
  nodes: Node[],
  edges: Edge[],
  selectedId: string | null | undefined,
): { nodes: Node[]; edges: Edge[] } {
  const trimmed = selectedId?.trim() ?? "";

  if (trimmed.length === 0) {
    return { nodes, edges };
  }

  const focusIds = new Set<string>([trimmed]);

  for (const edge of edges) {
    if (edge.source === trimmed) {
      focusIds.add(edge.target);
    }

    if (edge.target === trimmed) {
      focusIds.add(edge.source);
    }
  }

  const nextNodes = nodes.map((node) => {
    const baseStyle = node.style ?? {};
    const inFocus = focusIds.has(node.id);

    if (node.id === trimmed) {
      return {
        ...node,
        style: {
          ...baseStyle,
          opacity: 1,
          border: `4px solid ${SELECTED_BORDER}`,
          boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.25)",
        },
      };
    }

    if (inFocus) {
      return {
        ...node,
        style: {
          ...baseStyle,
          opacity: 1,
          border: `2px solid ${NEIGHBOR_BORDER}`,
        },
      };
    }

    return {
      ...node,
      style: {
        ...baseStyle,
        opacity: GRAPH_SELECTION_DIM_OPACITY,
      },
    };
  });

  const nextEdges = edges.map((edge) => {
    const inFocus = focusIds.has(edge.source) && focusIds.has(edge.target);
    const baseStyle = edge.style ?? {};

    return {
      ...edge,
      style: {
        ...baseStyle,
        opacity: inFocus ? 1 : GRAPH_SELECTION_DIM_OPACITY,
        strokeWidth: inFocus ? 2.25 : 1,
      },
    };
  });

  return { nodes: nextNodes, edges: nextEdges };
}
