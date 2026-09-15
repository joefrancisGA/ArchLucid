import { describe, expect, it } from "vitest";

import {
  countDiagramOutlineComponents,
  filterDiagramOutlineForTrivialComponents,
  partitionDiagramOutlineComponents,
} from "@/lib/infra-evidence/diagram-outline-connected-components";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

function buildOutline(nodeCount: number, edges: { from: string; to: string }[]): InfraEvidenceMermaidOutline {
  return {
    nodes: Array.from({ length: nodeCount }, (_, index) => ({
      id: `n${index}`,
      label: `Node ${index}`,
      resourceType: null,
      resourceGroup: null,
    })),
    edges: edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      label: null,
    })),
  };
}

describe("diagram-outline-connected-components", () => {
  it("counts only non-trivial connected components by default", () => {
    const outline = buildOutline(4, [
      { from: "n0", to: "n1" },
      { from: "n2", to: "n3" },
    ]);

    expect(partitionDiagramOutlineComponents(outline).significant).toHaveLength(2);
    expect(partitionDiagramOutlineComponents(outline).trivial).toHaveLength(0);
    expect(countDiagramOutlineComponents(outline)).toBe(2);
    expect(countDiagramOutlineComponents(outline, { includeTrivial: true })).toBe(2);
  });

  it("treats unconnected single nodes as trivial components", () => {
    const outline = buildOutline(5, [
      { from: "n0", to: "n1" },
      { from: "n1", to: "n2" },
    ]);

    const partition = partitionDiagramOutlineComponents(outline);

    expect(partition.significant).toHaveLength(1);
    expect(partition.trivial).toEqual([{ nodeIds: ["n3"] }, { nodeIds: ["n4"] }]);
    expect(countDiagramOutlineComponents(outline)).toBe(1);
    expect(countDiagramOutlineComponents(outline, { includeTrivial: true })).toBe(3);
  });

  it("filters trivial nodes from the outline when the toggle is off", () => {
    const outline = buildOutline(3, [{ from: "n0", to: "n1" }]);
    const filtered = filterDiagramOutlineForTrivialComponents(outline, { showTrivialComponents: false });

    expect(filtered.nodes.map((node) => node.id)).toEqual(["n0", "n1"]);
    expect(filtered.edges).toHaveLength(1);
  });
});
