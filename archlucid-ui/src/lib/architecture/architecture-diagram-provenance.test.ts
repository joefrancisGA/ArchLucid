import { describe, expect, it } from "vitest";

import {
  buildArchitectureDiagramEdgeProvenanceDetail,
  buildArchitectureDiagramNodeProvenanceDetail,
  resolveEdgeProvenanceClass,
  resolveNodeProvenanceClass,
  summarizeArchitectureDiagramProvenance,
} from "@/lib/architecture/architecture-diagram-provenance";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";

const model: ArchitectureDiagramModel = {
  nodes: [
    {
      id: "system_a",
      label: "A",
      kind: "system",
      provenance: "inferred",
      removed: false,
      accepted: false,
    },
    {
      id: "system_b",
      label: "B",
      kind: "system",
      provenance: "inferred",
      removed: true,
      accepted: false,
    },
    {
      id: "system_c",
      label: "C",
      kind: "system",
      provenance: "asserted",
      removed: false,
      accepted: false,
    },
  ],
  edges: [
    {
      id: "edge_1",
      sourceId: "system_a",
      targetId: "system_a",
      label: "loop",
      provenance: "inferred",
      removed: false,
    },
    {
      id: "edge_2",
      sourceId: "system_a",
      targetId: "system_c",
      label: "link",
      provenance: "asserted",
      removed: false,
    },
  ],
  trustBoundaryLabels: [],
};

describe("summarizeArchitectureDiagramProvenance", () => {
  it("counts unaccepted inferred nodes and inferred edges", () => {
    expect(summarizeArchitectureDiagramProvenance(model).unconfirmedInferredCount).toBe(2);
    expect(summarizeArchitectureDiagramProvenance(null).unconfirmedInferredCount).toBe(0);
  });
});

describe("architecture diagram element provenance", () => {
  it("never labels inferred nodes as evidence-backed", () => {
    const inferredNode = model.nodes[0]!;

    expect(resolveNodeProvenanceClass(inferredNode, null)).toBe("inferred");
    expect(buildArchitectureDiagramNodeProvenanceDetail({ runId: "run-1", node: inferredNode, diagramVersionSource: null }).provenanceClass).toBe(
      "inferred",
    );
  });

  it("maps asserted nodes and edges to evidence-backed", () => {
    const assertedNode = model.nodes[2]!;
    const assertedEdge = model.edges[1]!;

    expect(resolveNodeProvenanceClass(assertedNode, null)).toBe("evidence-backed");
    expect(resolveEdgeProvenanceClass(assertedEdge, null)).toBe("evidence-backed");
  });

  it("maps user-edit diagram version source to user-drawn provenance", () => {
    const assertedNode = model.nodes[2]!;

    expect(resolveNodeProvenanceClass(assertedNode, "user-edit")).toBe("user-drawn");
    expect(
      buildArchitectureDiagramEdgeProvenanceDetail({
        runId: "run-1",
        edge: model.edges[1]!,
        diagramVersionSource: "user-edit",
      }).provenanceClass,
    ).toBe("user-drawn");
  });
});
