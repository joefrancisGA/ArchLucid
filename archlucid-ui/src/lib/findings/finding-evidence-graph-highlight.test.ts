import { describe, expect, it } from "vitest";

import {
  applyFindingEvidenceGraphHighlight,
  buildExaminedNodeIdSet,
  defaultFindingEvidenceGraphViewMode,
  resolveFindingEvidenceGraphViewModel,
} from "@/lib/findings/finding-evidence-graph-highlight";
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

  it("keeps examined nodes and their direct neighbours on the reasoning path", () => {
    const filtered = resolveFindingEvidenceGraphViewModel(sampleGraph, ["subnet-a"], "reasoningPath");

    expect(filtered.nodes.map((node) => node.id).sort()).toEqual(["subnet-a", "vm-1"]);
    expect(filtered.edges).toHaveLength(1);
    expect(filtered.nodeCount).toBe(2);
  });

  it("returns the whole graph in context mode", () => {
    const filtered = resolveFindingEvidenceGraphViewModel(sampleGraph, ["subnet-a"], "context");

    expect(filtered.nodes).toHaveLength(3);
  });

  it("keeps neighbours legible on the reasoning path but dims them in context mode", () => {
    const nodes = [
      { id: "vm-1", position: { x: 0, y: 0 }, data: { label: "VM" } },
      { id: "db-9", position: { x: 1, y: 0 }, data: { label: "DB" } },
    ];
    const edges = [{ id: "e1", source: "vm-1", target: "db-9" }];

    const context = applyFindingEvidenceGraphHighlight(nodes, edges, ["vm-1"], "context");

    expect(context.nodes[0]?.style?.opacity).toBe(1);
    expect(context.nodes[1]?.style?.opacity).toBeLessThan(1);
    expect(context.edges[0]?.animated).toBe(false);

    const reasoningPath = applyFindingEvidenceGraphHighlight(nodes, edges, ["vm-1"], "reasoningPath");

    expect(reasoningPath.nodes[0]?.style?.opacity).toBe(1);
    expect(reasoningPath.nodes[1]?.style?.opacity).toBeGreaterThan(
      Number(context.nodes[1]?.style?.opacity ?? 0),
    );
    expect(reasoningPath.edges[0]?.animated).toBe(true);
  });

  it("opens on the reasoning path whenever evidence was examined", () => {
    expect(defaultFindingEvidenceGraphViewMode(4)).toBe("reasoningPath");
    expect(defaultFindingEvidenceGraphViewMode(1)).toBe("reasoningPath");
    expect(defaultFindingEvidenceGraphViewMode(0)).toBe("context");
  });
});
