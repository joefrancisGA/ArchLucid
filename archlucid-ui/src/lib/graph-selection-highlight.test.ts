import { describe, expect, it } from "vitest";
import type { Edge, Node } from "reactflow";

import {
  GRAPH_SELECTION_DIM_OPACITY,
  applyGraphSelectionFocus,
} from "@/lib/graph-selection-highlight";

describe("applyGraphSelectionFocus", () => {
  const nodes: Node[] = [
    { id: "a", position: { x: 0, y: 0 }, data: {} },
    { id: "b", position: { x: 0, y: 0 }, data: {} },
    { id: "c", position: { x: 0, y: 0 }, data: {} },
  ];
  const edges: Edge[] = [
    { id: "e1", source: "a", target: "b" },
    { id: "e2", source: "b", target: "c" },
  ];

  it("returns inputs unchanged when nothing is selected", () => {
    expect(applyGraphSelectionFocus(nodes, edges, null)).toEqual({ nodes, edges });
    expect(applyGraphSelectionFocus(nodes, edges, "   ")).toEqual({ nodes, edges });
  });

  it("keeps the selection and neighbors opaque and dims the rest", () => {
    const result = applyGraphSelectionFocus(nodes, edges, "a");
    const byId = new Map(result.nodes.map((node) => [node.id, node]));

    expect(byId.get("a")?.style?.opacity).toBe(1);
    expect(byId.get("b")?.style?.opacity).toBe(1);
    expect(byId.get("c")?.style?.opacity).toBe(GRAPH_SELECTION_DIM_OPACITY);

    const edgeById = new Map(result.edges.map((edge) => [edge.id, edge]));

    expect(edgeById.get("e1")?.style?.opacity).toBe(1);
    expect(edgeById.get("e2")?.style?.opacity).toBe(GRAPH_SELECTION_DIM_OPACITY);
  });
});
