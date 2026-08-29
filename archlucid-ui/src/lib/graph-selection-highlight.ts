import type { Edge, Node } from "reactflow";

import { graphNodeKindCssVar } from "@/lib/graph-node-kind-presentation";

/** Edge opacity for nodes outside the selection focus set — labels stay on white labelBg. */
export const GRAPH_SELECTION_DIM_EDGE_OPACITY = 0.45;

const GRAPH_SELECTION_DIMMED_NODE_STYLE = {
  opacity: 1,
  background: graphNodeKindCssVar("default", "bg"),
  border: `1px solid ${graphNodeKindCssVar("default", "border")}`,
  color: "var(--al-text-secondary)",
  boxShadow: "none",
  fontWeight: 400,
} as const;

const SELECTED_BORDER = "var(--al-accent-interactive)";
const NEIGHBOR_BORDER = "var(--al-accent-border-focus)";

/**
 * Dim nodes/edges that are not the selection or an immediate neighbor.
 * Uses muted fills instead of whole-node opacity so label text stays AA-readable.
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
          boxShadow: "0 0 0 3px color-mix(in srgb, var(--al-accent-interactive) 25%, transparent)",
          color: "var(--al-text-primary)",
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
          color: "var(--al-text-primary)",
        },
      };
    }

    return {
      ...node,
      style: {
        ...baseStyle,
        ...GRAPH_SELECTION_DIMMED_NODE_STYLE,
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
        opacity: inFocus ? 1 : GRAPH_SELECTION_DIM_EDGE_OPACITY,
      },
    };
  });

  return { nodes: nextNodes, edges: nextEdges };
}
