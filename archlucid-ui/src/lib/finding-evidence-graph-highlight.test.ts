import { describe, expect, it } from "vitest";

import {
  applyFindingEvidenceGraphHighlight,
  buildExaminedNodeIdSet,
  defaultFindingEvidenceGraphViewMode,
  resolveFindingEvidenceGraphViewModel,
} from "@/lib/finding-evidence-graph-highlight";
import type { GraphViewModel } from "@/types/graph";

const sampleGraph: GraphViewModel = {
  nodes: [
    { id: "vm-1", label: "VM", type: "GraphNode", metadata: {} },
    { id: "subnet-a", label: "Subnet", type: "GraphNode", metadata: {} },
    { id: "db-9", label: "Database", type: "GraphNode", metadata: {} },
  ],
  edges: [
    { id: "e1", source: "vm-1", target: "subnet-a", type: "depends_on" },
    { id: "e2", source: "vm-1", target: "db-9", type: "connects" },
  ],
  nodeCount: 3,
  edgeCount: 2,
};

describe("finding-evidence-graph-highlight", () => {
  it("builds case-insensitive examined id set", () => {
    const set = buildExaminedNodeIdSet(["VM-1", " subnet-a "]);

    expect(set.has("vm-1")).toBe(true);
    expect(set.has("subnet-a")).toBe(true);
  });

  it("filters to evidence-only subgraph", () => {
    const filtered = resolveFindingEvidenceGraphViewModel(sampleGraph, ["vm-1", "subnet-a"], "evidenceOnly");

    expect(filtered.nodes.map((node) => node.id)).toEqual(["vm-1", "subnet-a"]);
    expect(filtered.edges).toHaveLength(1);
  });

  it("dims non-examined nodes in context mode", () => {
    const nodes = [
      { id: "vm-1", position: { x: 0, y: 0 }, data: { label: "VM" } },
      { id: "db-9", position: { x: 1, y: 0 }, data: { label: "DB" } },
    ];
    const edges = [{ id: "e1", source: "vm-1", target: "db-9" }];

    const result = applyFindingEvidenceGraphHighlight(nodes, edges, ["vm-1"], "context");

    expect(result.nodes[0]?.style?.opacity).toBe(1);
    expect(result.nodes[1]?.style?.opacity).toBeLessThan(1);
  });

  it("defaults to evidence-only for large graphs with small evidence footprint", () => {
    expect(defaultFindingEvidenceGraphViewMode(120, 4)).toBe("evidenceOnly");
    expect(defaultFindingEvidenceGraphViewMode(20, 4)).toBe("context");
  });
});
