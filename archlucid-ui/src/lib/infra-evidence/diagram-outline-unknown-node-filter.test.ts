import { describe, expect, it } from "vitest";

import {
  filterDiagramOutlineUnknownNodes,
  resolveDefaultDiagramOutlineUnknownNodeFilterScope,
  resolveDiagramOutlineStartingNode,
  resolveDiagramOutlineUnknownNodeFilterScopeForWorkbench,
} from "@/lib/infra-evidence/diagram-outline-unknown-node-filter";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

function outline(partial: Partial<InfraEvidenceMermaidOutline>): InfraEvidenceMermaidOutline {
  return {
    nodes: partial.nodes ?? [],
    edges: partial.edges ?? [],
    ...(partial.ledgerDrops === undefined ? {} : { ledgerDrops: partial.ledgerDrops }),
    ...(partial.dropGateRows === undefined ? {} : { dropGateRows: partial.dropGateRows }),
  };
}

describe("diagram-outline-unknown-node-filter", () => {
  it("defaults to starting resource group scope when a seed is set", () => {
    expect(resolveDefaultDiagramOutlineUnknownNodeFilterScope("seed-1")).toBe("startingResourceGroup");
    expect(resolveDefaultDiagramOutlineUnknownNodeFilterScope("")).toBe("all");
  });

  it("prefers diagram neighbors in dependency neighborhood mode when a seed is set", () => {
    expect(
      resolveDiagramOutlineUnknownNodeFilterScopeForWorkbench({
        startingSeedId: "seed-1",
        dependencyNeighborhoodMode: true,
      }),
    ).toBe("diagramNeighbor");
    expect(
      resolveDiagramOutlineUnknownNodeFilterScopeForWorkbench({
        startingSeedId: "seed-1",
        dependencyNeighborhoodMode: false,
      }),
    ).toBe("startingResourceGroup");
    expect(
      resolveDiagramOutlineUnknownNodeFilterScopeForWorkbench({
        startingSeedId: "",
        dependencyNeighborhoodMode: true,
      }),
    ).toBe("all");
  });

  it("filters unknown nodes to the starting resource group", () => {
    const diagram = outline({
      nodes: [
        { id: "n_seed", label: "storage", seedNodeId: "graph-seed", resourceGroup: "rg-a", connectionState: "Unknown" },
        { id: "n_same", label: "peer", resourceGroup: "rg-a", connectionState: "Unknown" },
        { id: "n_other", label: "far", resourceGroup: "rg-b", connectionState: "Unknown" },
      ],
      edges: [],
    });

    const starting = resolveDiagramOutlineStartingNode(diagram, "graph-seed");

    expect(starting?.id).toBe("n_seed");

    const filtered = filterDiagramOutlineUnknownNodes({
      nodes: diagram.nodes,
      outline: diagram,
      startingSeedId: "graph-seed",
      scope: "startingResourceGroup",
      searchQuery: "",
    });

    expect(filtered.map((node) => node.id)).toEqual(["n_seed", "n_same"]);
  });

  it("filters unknown nodes to diagram neighbors of the starting node", () => {
    const diagram = outline({
      nodes: [
        { id: "n_seed", label: "storage", seedNodeId: "graph-seed", resourceGroup: "rg-a", connectionState: "Unknown" },
        { id: "n_neighbor", label: "neighbor", resourceGroup: "rg-b", connectionState: "Unknown" },
        { id: "n_far", label: "far", resourceGroup: "rg-b", connectionState: "Unknown" },
      ],
      edges: [{ from: "n_seed", to: "n_neighbor", label: null, source: "observed", declaredConnectionId: null }],
    });

    const filtered = filterDiagramOutlineUnknownNodes({
      nodes: diagram.nodes,
      outline: diagram,
      startingSeedId: "graph-seed",
      scope: "diagramNeighbor",
      searchQuery: "",
    });

    expect(filtered.map((node) => node.id)).toEqual(["n_seed", "n_neighbor"]);
  });

  it("applies search across name, type, and resource group", () => {
    const diagram = outline({
      nodes: [
        {
          id: "n_adf",
          label: "adf-edw",
          resourceGroup: "anly-edw-dev",
          resourceType: "Microsoft.DataFactory/factories",
          connectionState: "Unknown",
        },
        {
          id: "n_ai",
          label: "ai-aep",
          resourceGroup: "anly-aep-dev",
          resourceType: "microsoft.insights/components",
          connectionState: "Unknown",
        },
      ],
      edges: [],
    });

    const filtered = filterDiagramOutlineUnknownNodes({
      nodes: diagram.nodes,
      outline: diagram,
      startingSeedId: null,
      scope: "all",
      searchQuery: "aep",
    });

    expect(filtered.map((node) => node.id)).toEqual(["n_ai"]);
  });
});
