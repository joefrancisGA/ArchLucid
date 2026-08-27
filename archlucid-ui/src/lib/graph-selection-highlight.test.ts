import { describe, expect, it } from "vitest";
import type { Edge, Node } from "reactflow";

import {
  GRAPH_SELECTION_DIM_EDGE_OPACITY,
  applyGraphSelectionFocus,
} from "@/lib/graph-selection-highlight";

describe("applyGraphSelectionFocus", () => {
  const nodes: Node[] = [
    { id: "a", position: { x: 0, y: 0 }, data: {}, style: { background: "#e8edf2" } },
    { id: "b", position: { x: 0, y: 0 }, data: {}, style: { background: "#ebe9f0" } },
    { id: "c", position: { x: 0, y: 0 }, data: {}, style: { background: "#dfe8ef" } },
  ];
  const edges: Edge[] = [
    { id: "e1", source: "a", target: "b" },
    { id: "e2", source: "b", target: "c" },
  ];

  it("returns inputs unchanged when nothing is selected", () => {
    expect(applyGraphSelectionFocus(nodes, edges, null)).toEqual({ nodes, edges });
    expect(applyGraphSelectionFocus(nodes, edges, "   ")).toEqual({ nodes, edges });
  });

  it("mutes non-focus nodes without whole-node opacity so labels stay readable", () => {
    const result = applyGraphSelectionFocus(nodes, edges, "a");
    const byId = new Map(result.nodes.map((node) => [node.id, node]));

    expect(byId.get("a")?.style?.opacity).toBe(1);
    expect(byId.get("b")?.style?.opacity).toBe(1);
    expect(byId.get("c")?.style?.opacity).toBe(1);
    expect(byId.get("c")?.style?.color).toBe("var(--al-text-secondary)");
    expect(byId.get("c")?.style?.background).toContain("--al-graph-kind-default-bg");

    const edgeById = new Map(result.edges.map((edge) => [edge.id, edge]));

    expect(edgeById.get("e1")?.style?.opacity).toBe(1);
    expect(edgeById.get("e2")?.style?.opacity).toBe(GRAPH_SELECTION_DIM_EDGE_OPACITY);
  });
});
