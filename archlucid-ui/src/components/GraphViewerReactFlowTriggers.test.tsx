import { describe, expect, it } from "vitest";

import type { GraphViewModel } from "@/types/graph";
import { pickHeroNodeId } from "@/components/GraphViewerReactFlowTriggers";

describe("GraphViewerReactFlowTriggers", () => {
  it("pickHeroNodeId prefers explicit default when present", () => {
    const graph: GraphViewModel = {
      nodes: [
        { id: "finding-1", type: "Finding", label: "Finding" },
        { id: "manifest-1", type: "GoldenManifest", label: "Manifest" },
      ],
      edges: [],
    };

    const hero = pickHeroNodeId(graph, "manifest-1");

    expect(hero?.id).toBe("manifest-1");
  });

  it("pickHeroNodeId falls back to first finding node", () => {
    const graph: GraphViewModel = {
      nodes: [
        { id: "manifest-1", type: "GoldenManifest", label: "Manifest" },
        { id: "finding-1", type: "Finding", label: "Finding" },
      ],
      edges: [],
    };

    const hero = pickHeroNodeId(graph, undefined);

    expect(hero?.id).toBe("finding-1");
  });
});
