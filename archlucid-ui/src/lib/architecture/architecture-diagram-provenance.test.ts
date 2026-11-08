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
  skippedUnlabeledEntityCount: 0,
  unmatchedDataFlows: [],
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
    const detail = buildArchitectureDiagramNodeProvenanceDetail({
      runId: "run-1",
      node: inferredNode,
      diagramVersionSource: null,
    });

    expect(detail.provenanceClass).toBe("inferred");
    expect(detail.sourceHref).toBeNull();
  });

  it("maps asserted nodes and edges to brief-asserted without evidence links", () => {
    const assertedNode = model.nodes[2]!;
    const assertedEdge = model.edges[1]!;

    expect(resolveNodeProvenanceClass(assertedNode, null)).toBe("brief-asserted");
    expect(resolveEdgeProvenanceClass(assertedEdge, null)).toBe("brief-asserted");
    expect(
      buildArchitectureDiagramNodeProvenanceDetail({
        runId: "run-1",
        node: assertedNode,
        diagramVersionSource: null,
      }).sourceHref,
    ).toBeNull();
  });

  it("keeps asserted provenance on user-edited diagram versions", () => {
    const assertedNode = model.nodes[2]!;

    expect(resolveNodeProvenanceClass(assertedNode, "user-edit")).toBe("brief-asserted");
    expect(
      buildArchitectureDiagramNodeProvenanceDetail({
        runId: "run-1",
        node: assertedNode,
        diagramVersionSource: "user-edit",
      }).sentence,
    ).not.toMatch(/placed or edited by an architect/i);
  });

  it("labels accepted inference separately from brief-asserted", () => {
    const acceptedInferredNode = {
      ...model.nodes[0]!,
      accepted: true,
    };

    expect(resolveNodeProvenanceClass(acceptedInferredNode, null)).toBe("accepted-inference");
    const detail = buildArchitectureDiagramNodeProvenanceDetail({
      runId: "run-1",
      node: acceptedInferredNode,
      diagramVersionSource: null,
    });
    expect(detail.provenanceClass).toBe("accepted-inference");
    expect(detail.sourceHref).toBeNull();
    expect(detail.sentence).toContain("accepted on this diagram");
  });

  it("does not name the architecture brief for inferred elements", () => {
    const inferredNode = model.nodes[0]!;

    expect(
      buildArchitectureDiagramNodeProvenanceDetail({
        runId: "run-1",
        node: inferredNode,
        diagramVersionSource: null,
      }).sentence,
    ).not.toMatch(/architecture brief/i);
    expect(
      buildArchitectureDiagramNodeProvenanceDetail({
        runId: "run-1",
        node: inferredNode,
        diagramVersionSource: null,
      }).sentence,
    ).toContain("An inference source was not stored on the element.");
  });

  it("prefixes regenerated diagram versions in provenance copy", () => {
    const assertedNode = model.nodes[2]!;

    expect(
      buildArchitectureDiagramNodeProvenanceDetail({
        runId: "run-1",
        node: assertedNode,
        diagramVersionSource: "regenerated",
      }).sentence,
    ).toMatch(/^This diagram version was regenerated\./);
  });
});
