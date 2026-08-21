import { describe, expect, it } from "vitest";

import {
  computeProvenanceGraphBounds,
  computeProvenanceGraphLayout,
  PROVENANCE_LAYER_HEIGHT,
  PROVENANCE_NODE_RADIUS,
} from "@/lib/provenance-graph-layout";
import type { ArchitectureLinkageEdge, ArchitectureLinkageNode } from "@/types/architecture-provenance";

const sampleNodes: ArchitectureLinkageNode[] = [
  { id: "n-ctx", type: "ContextSnapshot", referenceId: "ctx-1", name: "Source context reviewed" },
  { id: "n-find", type: "Finding", referenceId: "f-1", name: "PHI minimization risk" },
  { id: "n-manifest", type: "GoldenManifest", referenceId: "m-1", name: "Finalized review record" },
];

const sampleEdges: ArchitectureLinkageEdge[] = [
  { id: "e-1", type: "supports", fromNodeId: "n-ctx", toNodeId: "n-find" },
  { id: "e-2", type: "recorded in", fromNodeId: "n-find", toNodeId: "n-manifest" },
];

describe("computeProvenanceGraphLayout", () => {
  it("places later provenance layers below earlier layers", () => {
    const layout = computeProvenanceGraphLayout(sampleNodes, sampleEdges);
    const ctx = layout.nodes.find((node) => node.id === "n-ctx");
    const finding = layout.nodes.find((node) => node.id === "n-find");
    const manifest = layout.nodes.find((node) => node.id === "n-manifest");

    expect(ctx).toBeDefined();
    expect(finding).toBeDefined();
    expect(manifest).toBeDefined();

    if (ctx === undefined || finding === undefined || manifest === undefined) {
      return;
    }

    expect(ctx.y).toBeLessThan(finding.y);
    expect(finding.y).toBeLessThan(manifest.y);
  });

  it("includes node labels in computed bounds", () => {
    const layout = computeProvenanceGraphLayout(sampleNodes, sampleEdges);
    const bounds = computeProvenanceGraphBounds(layout.nodes);

    expect(bounds.height).toBeGreaterThan(PROVENANCE_NODE_RADIUS * 2 + 20);
    expect(bounds.width).toBeGreaterThan(0);

    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(bounds.minX - node.radius);
      expect(node.x).toBeLessThanOrEqual(bounds.maxX + node.radius);
    }
  });

  it("compacts empty provenance layers out of the layout", () => {
    const nodes: ArchitectureLinkageNode[] = [
      { id: "n-run", type: "run", referenceId: "r-1", name: "Review started" },
      { id: "n-find", type: "Finding", referenceId: "f-1", name: "Risk" },
      { id: "n-manifest", type: "goldenManifestPointer", referenceId: "m-1", name: "Finalized review record" },
    ];
    const layout = computeProvenanceGraphLayout(nodes, sampleEdges);
    const run = layout.nodes.find((node) => node.id === "n-run");
    const manifest = layout.nodes.find((node) => node.id === "n-manifest");

    expect(run).toBeDefined();
    expect(manifest).toBeDefined();

    if (run === undefined || manifest === undefined) {
      return;
    }

    const layerGap = manifest.y - run.y;

    expect(layerGap).toBeLessThan(PROVENANCE_LAYER_HEIGHT * 4);
  });

  it("returns stable layout for the same inputs", () => {
    const first = computeProvenanceGraphLayout(sampleNodes, sampleEdges);
    const second = computeProvenanceGraphLayout(sampleNodes, sampleEdges);

    expect(first.nodes.map((node) => node.x)).toEqual(second.nodes.map((node) => node.x));
    expect(first.nodes.map((node) => node.y)).toEqual(second.nodes.map((node) => node.y));
  });
});
