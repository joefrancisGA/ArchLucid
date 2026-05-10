import { describe, expect, it } from "vitest";

import type { GraphViewModel } from "@/types/graph";

import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";

import { isBuyerTrailPhiHeroNode, mapGraphToReactFlow } from "./graph-mapper";

describe("mapGraphToReactFlow", () => {
  it("returns empty arrays for an empty graph", () => {
    const empty: GraphViewModel = { nodes: [], edges: [] };
    const result = mapGraphToReactFlow(empty);

    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it("maps nodes to stable ids, grid positions, and combined labels", () => {
    const graph: GraphViewModel = {
      nodes: [
        { id: "a", label: "Alpha", type: "Decision" },
        { id: "b", label: "Beta", type: "Finding" },
      ],
      edges: [],
    };

    const { nodes } = mapGraphToReactFlow(graph);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).toBe("a");
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(nodes[0].data).toMatchObject({
      label: "Alpha\n(Decision)",
    });
    expect(nodes[0].data.raw).toEqual(graph.nodes[0]);

    expect(nodes[1].id).toBe("b");
    expect(nodes[1].position).toEqual({ x: 240, y: 0 });
    expect(nodes[1].data).toMatchObject({
      label: "Beta\n(Finding)",
    });
    expect(nodes[1].data.raw).toEqual(graph.nodes[1]);
  });

  it("maps edges with deterministic ids and smoothstep type", () => {
    const graph: GraphViewModel = {
      nodes: [
        { id: "s", label: "S", type: "GraphNode" },
        { id: "t", label: "T", type: "GraphNode" },
      ],
      edges: [{ source: "s", target: "t", type: "dependsOn" }],
    };

    const { edges } = mapGraphToReactFlow(graph);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: "s-t-dependsOn-0",
      source: "s",
      target: "t",
      label: "dependsOn",
      type: "smoothstep",
    });
  });

  it("uses humanized edge labels in buyerTrail presentation", () => {
    const graph: GraphViewModel = {
      nodes: [
        { id: "a", label: "A", type: "FindingsSnapshot" },
        { id: "b", label: "B", type: "Finding" },
      ],
      edges: [{ source: "a", target: "b", type: "raised" }],
    };

    const { edges } = mapGraphToReactFlow(graph, "buyerTrail");
    expect(edges[0]?.label).toBe("Flagged risk");
  });

  it("humanizes recorded-in edges for buyerTrail", () => {
    const graph: GraphViewModel = {
      nodes: [
        { id: "phi", label: "Risk", type: "Finding" },
        { id: "m", label: "Manifest", type: "GoldenManifest" },
      ],
      edges: [{ source: "phi", target: "m", type: "recorded in" }],
    };

    const { edges } = mapGraphToReactFlow(graph, "buyerTrail");
    expect(edges[0]?.label).toBe("Anchored in manifest");
  });

  it("places the PHI showcase finding near the visual center in buyerTrail layout", () => {
    const graph: GraphViewModel = {
      nodes: [
        { id: "n-run", label: "Run", type: "ArchitectureRun" },
        { id: "n-ctx", label: "Context", type: "ContextSnapshot" },
        { id: "n-graph", label: "Graph", type: "GraphSnapshot" },
        { id: "n-find", label: "Findings snap", type: "FindingsSnapshot" },
        {
          id: "n-phi",
          label: "PHI minimization risk",
          type: "Finding",
          metadata: { referenceId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID },
        },
        { id: "n-manifest", label: "Manifest", type: "GoldenManifest" },
        { id: "n-bundle", label: "Bundle", type: "ArtifactBundle" },
      ],
      edges: [],
    };

    const hero = graph.nodes.find((n) => isBuyerTrailPhiHeroNode(n));
    expect(hero?.id).toBe("n-phi");

    const { nodes } = mapGraphToReactFlow(graph, "buyerTrail");
    const phiPos = nodes.find((n) => n.id === "n-phi")?.position;
    const centerIdx = Math.floor(graph.nodes.length / 2);
    const columnCount = 4;
    const cellW = 320;
    const cellH = 196;

    expect(phiPos).toEqual({
      x: (centerIdx % columnCount) * cellW,
      y: Math.floor(centerIdx / columnCount) * cellH,
    });

    const phiNode = nodes.find((n) => n.id === "n-phi");
    expect(phiNode?.style?.border).toContain("4px");
  });
});
