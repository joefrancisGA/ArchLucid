import { describe, expect, it } from "vitest";

import {
  sortInfraEvidenceDiagramOutlineNodes,
  toggleInfraEvidenceDiagramOutlineNodeSort,
} from "@/lib/infra-evidence/infra-evidence-diagram-outline-sort";
import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

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
});
