import { describe, expect, it } from "vitest";

import {
  sortInfraEvidenceDiagramOutlineEdges,
  sortInfraEvidenceDiagramOutlineNodes,
  toggleInfraEvidenceDiagramOutlineEdgeSort,
  toggleInfraEvidenceDiagramOutlineNodeSort,
} from "@/lib/infra-evidence/infra-evidence-diagram-outline-sort";
import type {
  InfraEvidenceMermaidOutlineEdge,
  InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

const nodes: readonly InfraEvidenceMermaidOutlineNode[] = [
  {
    id: "n_b",
    label: "beta-node",
    resourceType: "Microsoft.Storage/storageAccounts",
    resourceGroup: "rg-b",
  },
  {
    id: "n_a",
    label: "alpha-node",
    resourceType: "Microsoft.Network/virtualNetworks",
    resourceGroup: "rg-a",
  },
];

const edges: readonly InfraEvidenceMermaidOutlineEdge[] = [
  { from: "n_b", to: "n_a", label: "privateEndpoint" },
  { from: "n_a", to: "n_b", label: null },
];

describe("infra-evidence-diagram-outline-sort", () => {
  it("toggles direction on the active column and resets to ascending on a new column", () => {
    expect(toggleInfraEvidenceDiagramOutlineNodeSort("label", "asc", "label")).toEqual({
      sortKey: "label",
      sortDir: "desc",
    });

    expect(toggleInfraEvidenceDiagramOutlineNodeSort("label", "desc", "resourceGroup")).toEqual({
      sortKey: "resourceGroup",
      sortDir: "asc",
    });
  });

  it("sorts nodes by label ascending with stable id tie-break", () => {
    const sorted = sortInfraEvidenceDiagramOutlineNodes(nodes, "label", "asc");

    expect(sorted.map((node) => node.label)).toEqual(["alpha-node", "beta-node"]);
  });

  it("sorts nodes by resource group descending", () => {
    const sorted = sortInfraEvidenceDiagramOutlineNodes(nodes, "resourceGroup", "desc");

    expect(sorted.map((node) => node.resourceGroup)).toEqual(["rg-b", "rg-a"]);
  });

  it("sorts nodes by friendly resource type name", () => {
    const sorted = sortInfraEvidenceDiagramOutlineNodes(nodes, "resourceType", "asc");

    expect(sorted.map((node) => node.resourceType)).toEqual([
      "Microsoft.Storage/storageAccounts",
      "Microsoft.Network/virtualNetworks",
    ]);
  });

  it("toggles edge sort direction and resets to ascending on a new column", () => {
    expect(toggleInfraEvidenceDiagramOutlineEdgeSort("from", "asc", "from")).toEqual({
      sortKey: "from",
      sortDir: "desc",
    });

    expect(toggleInfraEvidenceDiagramOutlineEdgeSort("from", "desc", "relationship")).toEqual({
      sortKey: "relationship",
      sortDir: "asc",
    });
  });

  it("sorts edges by resolved relationship labels", () => {
    const sorted = sortInfraEvidenceDiagramOutlineEdges(edges, nodes, "relationship", "asc");

    expect(sorted.map((edge) => edge.label)).toEqual([null, "privateEndpoint"]);
  });

  it("sorts edges by resolved from node labels", () => {
    const sorted = sortInfraEvidenceDiagramOutlineEdges(edges, nodes, "from", "desc");

    expect(sorted.map((edge) => edge.from)).toEqual(["n_b", "n_a"]);
  });
});
