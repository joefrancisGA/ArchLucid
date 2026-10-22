import { describe, expect, it } from "vitest";

import { graphViewModelFilteredByNodeType } from "@/lib/graph-view-model-type-filter";
import type { GraphViewModel } from "@/types/graph";

describe("graphViewModelFilteredByNodeType", () => {
  it("returns full graph when filter empty", () => {
    const g: GraphViewModel = {
      nodes: [
        { id: "a", label: "A", type: "One" },
        { id: "b", label: "B", type: "Two" },
      ],
      edges: [{ source: "a", target: "b", type: "x" }],
    };

    expect(graphViewModelFilteredByNodeType(g, "").nodes).toHaveLength(2);
    expect(graphViewModelFilteredByNodeType(g, "   ").nodes).toHaveLength(2);
  });

  it("drops orphan edges when filtering", () => {
    const g: GraphViewModel = {
      nodes: [
        { id: "a", label: "A", type: "Keep" },
        { id: "b", label: "B", type: "Drop" },
      ],
      edges: [{ source: "a", target: "b", type: "x" }],
    };

    const f = graphViewModelFilteredByNodeType(g, "Keep");

    expect(f.nodes).toHaveLength(1);
    expect(f.edges).toHaveLength(0);
  });
});
