import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";

import { InfraEvidenceDiagramOutline } from "@/components/infra-evidence/InfraEvidenceDiagramOutline";
import * as graphViewModelExport from "@/lib/graph-view-model-export";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

vi.mock("@/lib/security-declared-connection-api", () => ({
  listSecurityDeclaredConnections: vi.fn(async () => []),
}));

const outline: InfraEvidenceMermaidOutline = {
  nodes: [
    {
      id: "n_src",
      label: "core-vnet",
      resourceType: "Microsoft.Network/virtualNetworks",
      resourceGroup: "rg-network",
    },
    {
      id: "n_dst",
      label: "app-storage",
      resourceType: "Microsoft.Storage/storageAccounts",
      resourceGroup: "rg-apps",
    },
  ],
  edges: [
    {
      from: "n_src",
      to: "n_missing",
      label: null,
      source: "missing",
      confidenceBand: "missing",
      provenanceKind: null,
      inferenceSource: null,
      declaredConnectionId: null,
    },
  ],
  ledgerDrops: [],
};

function getNodesTable(): HTMLTableElement {
  return within(screen.getByTestId("infra-diagrams-connected-nodes-list")).getByRole("table");
}

function getUnconnectedNodesList(): HTMLElement {
  return screen.getByTestId("infra-diagrams-unconnected-nodes-list");
}

function getEdgesTable(): HTMLTableElement {
  const panel = screen.getByTestId("infra-diagrams-outline-edges-panel");

  return within(panel).getByRole("table");
}

function getFirstConnectedDataRow(table: HTMLTableElement): HTMLTableRowElement {
  const rows = within(table).getAllByRole("row");

  for (const row of rows) {
    if (row.querySelector("th") === null) {
      return row;
    }
  }

  throw new Error("No connected data row found");
}

function countNodeDataRows(table: HTMLTableElement): number {
  return within(table)
    .getAllByRole("row")
    .filter((row) => row.querySelector("th") === null).length;
}

describe("InfraEvidenceDiagramOutline", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("collapses nodes and edges tables by default", () => {
    render(<InfraEvidenceDiagramOutline outline={outline} />);

    expect(screen.getByTestId("infra-diagrams-mermaid-outline")).toBeTruthy();
    expect(screen.getByTestId("infra-diagrams-outline-nodes-disclosure")).toHaveTextContent("Nodes (2)");
    expect(screen.getByTestId("infra-diagrams-outline-edges-disclosure")).toHaveTextContent("Edges (1)");
    expect(screen.getByTestId("infra-diagrams-outline-nodes-disclosure")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("infra-diagrams-outline-edges-disclosure")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("infra-diagrams-outline-nodes-panel")).toBeNull();
    expect(screen.queryByTestId("infra-diagrams-outline-edges-panel")).toBeNull();
  });

  it("expands the nodes table when the disclosure is clicked", () => {
    render(<InfraEvidenceDiagramOutline outline={outline} />);

    fireEvent.click(screen.getByTestId("infra-diagrams-outline-nodes-disclosure"));

    expect(screen.getByTestId("infra-diagrams-outline-nodes-disclosure")).toHaveAttribute("aria-expanded", "true");
    expect(getNodesTable()).toBeTruthy();
    expect(within(getNodesTable()).getByText("core-vnet")).toBeTruthy();
  });

  it("shows the nodes table immediately when defaultNodesOpen is true", () => {
    render(<InfraEvidenceDiagramOutline outline={outline} defaultNodesOpen={true} />);

    expect(screen.getByTestId("infra-diagrams-outline-nodes-disclosure")).toHaveAttribute("aria-expanded", "true");
    expect(getNodesTable()).toBeTruthy();
  });

  it("shows edge relationship labels in the Edges table", () => {
    render(<InfraEvidenceDiagramOutline outline={outline} defaultNodesOpen={true} defaultEdgesOpen={true} />);

    const root = screen.getByTestId("infra-diagrams-mermaid-outline");
    const edgesTable = getEdgesTable();
    const nodesTable = getNodesTable();

    expect(root).toBeTruthy();
    expect(edgesTable).not.toBeNull();
    expect(nodesTable).not.toBeNull();

    expect(within(edgesTable).getByRole("columnheader", { name: "Relationship" })).toBeTruthy();
    expect(within(edgesTable).getByRole("columnheader", { name: "To" })).toBeTruthy();
    expect(within(edgesTable).getByRole("button", { name: "Sort by From, ascending" })).toBeTruthy();
    expect(within(edgesTable).getByText("Not recorded")).toBeTruthy();

    expect(within(nodesTable).getByRole("button", { name: "Sort by Node Name, ascending" })).toBeTruthy();
    expect(within(nodesTable).getByRole("button", { name: "Sort by Resource type" })).toBeTruthy();
    expect(within(nodesTable).getByRole("button", { name: "Sort by Resource group" })).toBeTruthy();
    expect(within(edgesTable).getByRole("button", { name: "Sort by From, ascending" })).toBeTruthy();
    expect(within(edgesTable).getByRole("button", { name: "Sort by Relationship" })).toBeTruthy();
    expect(within(edgesTable).getByRole("button", { name: "Sort by To" })).toBeTruthy();
    expect(within(nodesTable).queryByRole("columnheader", { name: "Id" })).toBeNull();
    expect(within(nodesTable).getByText("core-vnet")).toBeTruthy();
    expect(within(nodesTable).getByText("Virtual Network")).toBeTruthy();
    expect(within(nodesTable).queryByText("(Virtual Network)")).toBeNull();
    expect(within(nodesTable).queryByText("Microsoft.Network/virtualNetworks")).toBeNull();
    expect(within(nodesTable).getByText("rg-network")).toBeTruthy();
    expect(within(edgesTable).getByText("core-vnet")).toBeTruthy();
    expect(within(edgesTable).getByText("Endpoint was not in this diagram outline")).toBeTruthy();
  });

  it("separates edge sources and lists probable edges before observed edges", () => {
    const groupedOutline: InfraEvidenceMermaidOutline = {
      ...outline,
      edges: [
        ...outline.edges,
        {
          from: "n_src",
          to: "n_dst",
          label: "connects",
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
        {
          from: "n_dst",
          to: "n_src",
          label: "May access",
          source: "probable",
          confidenceBand: "probable",
          provenanceKind: "DerivedFact",
          inferenceSource: "inventory-app-authorized-access",
          declaredConnectionId: null,
        },
      ],
    };

    render(<InfraEvidenceDiagramOutline outline={groupedOutline} defaultEdgesOpen={true} />);

    const probableGroup = screen.getByTestId("infra-diagrams-edge-source-probable");
    const observedGroup = screen.getByTestId("infra-diagrams-edge-source-observed");

    expect(within(probableGroup).getByText("Probable edges (1)")).toBeInTheDocument();
    expect(within(observedGroup).getByText("Observed edges (1)")).toBeInTheDocument();
    expect(probableGroup.compareDocumentPosition(observedGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("appends the To resource type when From and To share a name", () => {
    const privateEndpointOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_pe",
          label: "cosmos-sql-account (Private endpoint)",
          resourceType: "Microsoft.Network/privateEndpoints",
          resourceGroup: "rg-network",
        },
        {
          id: "n_cosmos",
          label: "cosmos-sql-account (Cosmos DB)",
          resourceType: "Microsoft.DocumentDB/databaseAccounts",
          resourceGroup: "rg-data",
        },
      ],
      edges: [
        {
          from: "n_pe",
          to: "n_cosmos",
          label: "connects",
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    };

    render(
      <InfraEvidenceDiagramOutline
        outline={privateEndpointOutline}
        defaultNodesOpen={true}
        defaultEdgesOpen={true}
      />,
    );

    const edgesTable = getEdgesTable();

    expect(edgesTable).not.toBeNull();

    const cells = within(edgesTable).getAllByRole("cell");

    expect(cells.map((cell) => cell.textContent)).toEqual([
      "Observed",
      "cosmos-sql-account",
      "connects",
      "cosmos-sql-account (Cosmos DB)",
    ]);
  });

  it("shows peering for unlabeled VNet-to-VNet edges", () => {
    const peeringOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_a",
          label: "vnet-eastus",
          resourceType: "Microsoft.Network/virtualNetworks",
          resourceGroup: "rg-east",
        },
        {
          id: "n_b",
          label: "vnet-westus",
          resourceType: "Microsoft.Network/virtualNetworks",
          resourceGroup: "rg-west",
        },
      ],
      edges: [
        {
          from: "n_a",
          to: "n_b",
          label: null,
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    };

    render(
      <InfraEvidenceDiagramOutline outline={peeringOutline} defaultNodesOpen={true} defaultEdgesOpen={true} />,
    );

    const edgesTable = getEdgesTable();

    expect(edgesTable).not.toBeNull();
    expect(within(edgesTable).getByText("Not recorded")).toBeTruthy();
    expect(within(edgesTable).queryByText("—")).toBeNull();
  });

  it("focuses a neighborhood from a Nodes row", () => {
    const onFocusNeighborhood = vi.fn();

    render(
      <InfraEvidenceDiagramOutline
        outline={outline}
        onFocusNeighborhood={onFocusNeighborhood}
        defaultNodesOpen={true}
      />,
    );

    expect(screen.getByTestId("infra-diagrams-nodes-seed-hint")).toHaveTextContent(
      "To diagram one resource and its neighbors, choose Focus neighborhood on that row.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Focus neighborhood from core-vnet" }));

    expect(onFocusNeighborhood).toHaveBeenCalledTimes(1);
    expect(onFocusNeighborhood.mock.calls[0]?.[0]).toMatchObject({
      id: "n_src",
      label: "core-vnet",
    });
  });

  it("sorts node rows when a column heading is clicked", () => {
    const sortableNodeOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_src",
          label: "core-vnet",
          resourceType: "Microsoft.Network/virtualNetworks",
          resourceGroup: "rg-network",
        },
        {
          id: "n_dst",
          label: "app-storage",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-apps",
        },
      ],
      edges: [
        {
          from: "n_src",
          to: "n_dst",
          label: null,
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    };

    render(<InfraEvidenceDiagramOutline outline={sortableNodeOutline} defaultNodesOpen={true} />);

    const nodesTable = getNodesTable();

    expect(nodesTable).not.toBeNull();

    const nodeNameHeader = within(nodesTable).getByRole("button", { name: "Sort by Node Name, ascending" });
    const resourceTypeHeader = within(nodesTable).getByRole("button", {
      name: "Sort by Resource type",
    });
    const resourceGroupHeader = within(nodesTable).getByRole("button", {
      name: "Sort by Resource group",
    });

    expect(getFirstConnectedDataRow(nodesTable).textContent).toContain("app-storage");
    expect(nodeNameHeader).toHaveAttribute("aria-label", "Sort by Node Name, ascending");

    fireEvent.click(nodeNameHeader);

    expect(getFirstConnectedDataRow(nodesTable).textContent).toContain("core-vnet");
    expect(nodeNameHeader).toHaveAttribute("aria-label", "Sort by Node Name, descending");

    fireEvent.click(nodeNameHeader);

    expect(getFirstConnectedDataRow(nodesTable).textContent).toContain("app-storage");
    expect(nodeNameHeader).toHaveAttribute("aria-label", "Sort by Node Name, ascending");

    fireEvent.click(resourceTypeHeader);

    expect(getFirstConnectedDataRow(nodesTable).textContent).toContain("app-storage");
    expect(resourceTypeHeader).toHaveAttribute("aria-label", "Sort by Resource type, ascending");

    fireEvent.click(resourceTypeHeader);

    expect(getFirstConnectedDataRow(nodesTable).textContent).toContain("core-vnet");
    expect(resourceTypeHeader).toHaveAttribute("aria-label", "Sort by Resource type, descending");

    fireEvent.click(resourceGroupHeader);

    expect(getFirstConnectedDataRow(nodesTable).textContent).toContain("app-storage");
    expect(resourceGroupHeader).toHaveAttribute("aria-label", "Sort by Resource group, ascending");
  });

  it("lists every connected node and every unconnected node", () => {
    const threeNodeOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_a",
          label: "alpha-node",
          resourceType: "Microsoft.Network/virtualNetworks",
          resourceGroup: "rg-a",
        },
        {
          id: "n_b",
          label: "beta-node",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-b",
        },
        {
          id: "n_c",
          label: "gamma-node",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-c",
          connectionState: "Unconnected",
        },
      ],
      edges: [
        {
          from: "n_a",
          to: "n_b",
          label: null,
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    };

    render(<InfraEvidenceDiagramOutline outline={threeNodeOutline} defaultNodesOpen={true} />);

    const nodesTable = getNodesTable();

    expect(screen.getByText("Connected on the diagram (2)")).toBeTruthy();
    expect(within(getUnconnectedNodesList()).getByText("Stands alone (1)")).toBeTruthy();
    expect(
      countNodeDataRows(nodesTable)
      + countNodeDataRows(within(getUnconnectedNodesList()).getByRole("table")),
    ).toBe(3);
    expect(screen.queryByTestId("infra-diagrams-outline-nodes-truncated")).toBeNull();
  });

  it("places the unconnected node list below the connected node list", () => {
    const stackedOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        ...outline.nodes,
        {
          id: "n_extra",
          label: "standalone-resource",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-extra",
          connectionState: "Unconnected",
        },
      ],
      edges: outline.edges,
    };

    render(<InfraEvidenceDiagramOutline outline={stackedOutline} defaultNodesOpen={true} />);

    const connectedList = screen.getByTestId("infra-diagrams-connected-nodes-list");
    const unconnectedList = screen.getByTestId("infra-diagrams-unconnected-nodes-list");

    expect(connectedList.compareDocumentPosition(unconnectedList) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("lists every node and every edge when the outline is larger than 200 rows", () => {
    const manyNodeOutline: InfraEvidenceMermaidOutline = {
      nodes: Array.from({ length: 201 }, (_, index) => ({
        id: `n_${index}`,
        label: `node-${String(index).padStart(3, "0")}`,
        resourceType: "Microsoft.Storage/storageAccounts",
        resourceGroup: `rg-${index}`,
      })),
      edges: Array.from({ length: 201 }, (_, index) => ({
        from: "n_0",
        to: `n_${index}`,
        label: null,
        source: "observed" as const,
        confidenceBand: "observed" as const,
        provenanceKind: null,
        inferenceSource: null,
        declaredConnectionId: null,
      })),
    };

    render(
      <InfraEvidenceDiagramOutline outline={manyNodeOutline} defaultNodesOpen={true} defaultEdgesOpen={true} />,
    );

    const nodesTable = getNodesTable();
    const edgesTable = getEdgesTable();

    expect(screen.getByText("Connected on the diagram (201)")).toBeTruthy();
    expect(screen.queryByTestId("infra-diagrams-unconnected-nodes-list")).toBeNull();
    expect(countNodeDataRows(nodesTable)).toBe(201);
    expect(within(edgesTable).getAllByRole("row")).toHaveLength(203);
    expect(screen.queryByTestId("infra-diagrams-outline-nodes-truncated")).toBeNull();
  });

  it("shows authorization evidence for probable May access edges", () => {
    const mayAccessOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "web_app",
          label: "orders-api",
          resourceType: "Microsoft.Web/sites",
          resourceGroup: "rg-app",
        },
        {
          id: "sql_db",
          label: "orders-db",
          resourceType: "Microsoft.Sql/servers/databases",
          resourceGroup: "rg-data",
        },
      ],
      edges: [
        {
          from: "web_app",
          to: "sql_db",
          label: "May access",
          source: "probable",
          confidenceBand: "probable",
          provenanceKind: "DerivedFact",
          inferenceSource: "inventory-app-authorized-access",
          declaredConnectionId: null,
        },
      ],
    };

    render(
      <InfraEvidenceDiagramOutline
        outline={mayAccessOutline}
        defaultNodesOpen={true}
        defaultEdgesOpen={true}
      />,
    );

    fireEvent.click(screen.getByTestId("infra-diagrams-inventory-edge-web_app-sql_db"));

    const detailPanel = screen.getByTestId("infra-evidence-inventory-edge-detail-panel");

    expect(detailPanel).toBeInTheDocument();
    expect(within(detailPanel).getByText("Probable")).toBeInTheDocument();
    expect(within(detailPanel).getByText(/Authorization from managed identity and RBAC/)).toBeInTheDocument();
  });

  it("clears a selected edge detail panel when the outline changes", () => {
    const declaredOutline: InfraEvidenceMermaidOutline = {
      ...outline,
      edges: [
        {
          from: "n_src",
          to: "n_dst",
          label: "declared",
          source: "declared",
          confidenceBand: "declared",
          provenanceKind: "DeclaredFact",
          inferenceSource: null,
          declaredConnectionId: "declared-connection-1",
        },
      ],
    };

    const { rerender } = render(
      <InfraEvidenceDiagramOutline
        outline={declaredOutline}
        defaultEdgesOpen={true}
      />,
    );

    fireEvent.click(screen.getByTestId("infra-diagrams-declared-edge-n_src-n_dst"));
    const declaredPanel = screen.getByTestId("infra-evidence-declared-connection-panel");
    expect(declaredPanel).toBeInTheDocument();
    expect(within(declaredPanel).queryByText("Approver was not included on the loaded connection")).not.toBeInTheDocument();

    rerender(<InfraEvidenceDiagramOutline outline={outline} defaultEdgesOpen={true} />);

    expect(screen.queryByTestId("infra-evidence-declared-connection-panel")).not.toBeInTheDocument();
  });

  it("downloads the structured node and edge lists as JSON", () => {
    const downloadSpy = vi.spyOn(graphViewModelExport, "downloadBrowserTextFile").mockImplementation(() => {});

    render(<InfraEvidenceDiagramOutline outline={outline} />);

    fireEvent.click(screen.getByTestId("infra-diagrams-download-nodes-json"));
    fireEvent.click(screen.getByTestId("infra-diagrams-download-edges-json"));

    expect(downloadSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^infra-diagram-nodes-.*\.json$/u),
      expect.stringContaining('"note": "These rows are the diagram outline. Edges may be observed, declared, probable, or inferred. A property that is absent was not stored."'),
      "application/json;charset=utf-8",
    );
    expect(downloadSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^infra-diagram-edges-.*\.json$/u),
      expect.stringContaining('"exportKind": "ArchLucid.InfraEvidenceDiagram.edges.v1"'),
      "application/json;charset=utf-8",
    );
    expect(screen.getByText(
      "Download the nodes and edges for this diagram. The file includes observed, declared, probable, and inferred rows. An absent property was not stored.",
    )).toBeInTheDocument();

    downloadSpy.mockRestore();
  });

  it("sorts edge rows when a column heading is clicked", () => {
    const sortableOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_a",
          label: "alpha-node",
          resourceType: "Microsoft.Network/virtualNetworks",
          resourceGroup: "rg-a",
        },
        {
          id: "n_b",
          label: "beta-node",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-b",
        },
        {
          id: "n_c",
          label: "gamma-node",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-c",
        },
      ],
      edges: [
        {
          from: "n_b",
          to: "n_c",
          label: "privateEndpoint",
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
        {
          from: "n_a",
          to: "n_b",
          label: null,
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
        {
          from: "n_c",
          to: "n_a",
          label: "peering",
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    };

    render(
      <InfraEvidenceDiagramOutline outline={sortableOutline} defaultNodesOpen={true} defaultEdgesOpen={true} />,
    );

    const edgesTable = getEdgesTable();

    expect(edgesTable).not.toBeNull();

    const fromHeader = within(edgesTable).getByRole("button", { name: "Sort by From, ascending" });
    const relationshipHeader = within(edgesTable).getByRole("button", {
      name: "Sort by Relationship",
    });
    const toHeader = within(edgesTable).getByRole("button", { name: "Sort by To" });

    expect(getFirstConnectedDataRow(edgesTable).textContent).toContain("alpha-node");

    fireEvent.click(fromHeader);

    expect(getFirstConnectedDataRow(edgesTable).textContent).toContain("gamma-node");
    expect(fromHeader).toHaveAttribute("aria-label", "Sort by From, descending");

    fireEvent.click(relationshipHeader);

    expect(getFirstConnectedDataRow(edgesTable).textContent).toContain("alpha-node");
    expect(relationshipHeader).toHaveAttribute("aria-label", "Sort by Relationship, ascending");

    fireEvent.click(toHeader);

    expect(getFirstConnectedDataRow(edgesTable).textContent).toContain("alpha-node");
    expect(toHeader).toHaveAttribute("aria-label", "Sort by To, ascending");
  });

  it("shows unknown questions notice and empty-detail reason without inputs", () => {
    const unknownOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_unknown",
          label: "mystery-storage",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-data",
          connectionState: "Unknown",
        },
      ],
      edges: [],
      ledgerDrops: [],
    };

    render(<InfraEvidenceDiagramOutline outline={unknownOutline} defaultNodesOpen={true} />);

    expect(screen.getByTestId("infra-diagrams-unknown-questions")).toHaveTextContent(
      "ArchLucid has a question about 1 resource.",
    );
    const unknownSection = screen.getByTestId("infra-diagrams-unknown-nodes-list");
    expect(within(unknownSection).getByText("Needs evidence (1)")).toBeTruthy();
    expect(
      within(unknownSection).getByText(
        "No connection state detail was stored.",
      ),
    ).toBeTruthy();
    expect(within(unknownSection).queryByRole("textbox")).toBeNull();
    expect(within(unknownSection).queryByRole("button", { name: /save/i })).toBeNull();
  });

  it("shows unresolved relationship details on unknown rows", () => {
    const unknownOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_unknown",
          label: "mystery-storage",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-data",
          connectionState: "Unknown",
          unresolvedRelationshipDetails: ["Route table hop unresolved"],
        },
      ],
      edges: [],
    };

    render(<InfraEvidenceDiagramOutline outline={unknownOutline} defaultNodesOpen={true} />);

    expect(
      within(screen.getByTestId("infra-diagrams-unknown-nodes-list")).getByText("Route table hop unresolved"),
    ).toBeTruthy();
  });

  it("puts orphaned-node problems in a separate Problem column", () => {
    const orphanedOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_orphan",
          label: "bastion-01 (Bastionhosts) · missing a required link: required subnet no longer exists",
          resourceType: "Microsoft.Network/bastionHosts",
          resourceGroup: "rg-network",
          connectionState: "Orphaned",
        },
      ],
      edges: [],
    };

    render(<InfraEvidenceDiagramOutline outline={orphanedOutline} defaultNodesOpen={true} />);

    const section = screen.getByTestId("infra-diagrams-orphaned-nodes-list");
    expect(within(section).getByRole("columnheader", { name: "Problem" })).toBeInTheDocument();
    expect(within(section).getByText("bastion-01")).toBeInTheDocument();
    expect(within(section).getByText(/missing a required link: required subnet no longer exists/u)).toBeInTheDocument();
    expect(within(section).getByText(/Bastion/u)).toBeInTheDocument();
    expect(within(section).queryByText(/bastion-01 .*missing a required link/u)).toBeNull();
  });

  it("shows stored questionable reason and action metadata in the Problem column", () => {
    render(
      <InfraEvidenceDiagramOutline
        outline={{
          nodes: [
            {
              id: "n_questionable",
              label: "avd-host",
              resourceType: "Microsoft.DesktopVirtualization/hostPools",
              resourceGroup: "rg-desktop",
              connectionState: "Orphaned",
              questionableReason: "Named like an AVD host and not registered",
              questionableAction: "Register or retire the resource",
            },
          ],
          edges: [],
        }}
        defaultNodesOpen={true}
      />,
    );

    const section = screen.getByTestId("infra-diagrams-orphaned-nodes-list");

    expect(within(section).getByText(
      "Named like an AVD host and not registered Recommended action: Register or retire the resource",
    )).toBeInTheDocument();
  });

  it("does not show questions notice for unconnected shared-service types", () => {
    const workspaceOutline: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_law",
          label: "law-app",
          resourceType: "Microsoft.OperationalInsights/workspaces",
          resourceGroup: "rg-ops",
          connectionState: "Unconnected",
        },
      ],
      edges: [],
    };

    render(<InfraEvidenceDiagramOutline outline={workspaceOutline} defaultNodesOpen={true} />);

    expect(screen.queryByTestId("infra-diagrams-unknown-questions")).toBeNull();
    expect(screen.getByTestId("infra-diagrams-unconnected-nodes-list")).toBeTruthy();
    expect(screen.queryByTestId("infra-diagrams-unknown-nodes-list")).toBeNull();
  });

  it("hides empty state sections when all nodes are connected", () => {
    const connectedOnly: InfraEvidenceMermaidOutline = {
      nodes: [
        {
          id: "n_a",
          label: "alpha",
          resourceType: "Microsoft.Network/virtualNetworks",
          resourceGroup: "rg-a",
          connectionState: "Connected",
        },
        {
          id: "n_b",
          label: "beta",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg-b",
          connectionState: "Connected",
        },
      ],
      edges: [
        {
          from: "n_a",
          to: "n_b",
          label: null,
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    };

    render(<InfraEvidenceDiagramOutline outline={connectedOnly} defaultNodesOpen={true} />);

    expect(screen.getByTestId("infra-diagrams-connected-nodes-list")).toBeTruthy();
    expect(screen.queryByTestId("infra-diagrams-used-nodes-list")).toBeNull();
    expect(screen.queryByTestId("infra-diagrams-orphaned-nodes-list")).toBeNull();
    expect(screen.queryByTestId("infra-diagrams-unconnected-nodes-list")).toBeNull();
    expect(screen.queryByTestId("infra-diagrams-unknown-nodes-list")).toBeNull();
  });

  it("renders ledger drops when mermaid outline includes them", () => {
    render(
      <InfraEvidenceDiagramOutline
        outline={{
          nodes: [
            {
              id: "n_nsg",
              label: "nsg-app",
              resourceType: "Microsoft.Network/networkSecurityGroups",
              resourceGroup: "rg-net",
            },
          ],
          edges: [],
          ledgerDrops: [{ reason: "nsg-unattached", from: "n_nsg", to: null }],
        }}
        defaultNodesOpen={true}
      />,
    );

    expect(screen.getByTestId("infra-diagrams-ledger-drops-list")).toHaveTextContent("Dropped imports");
  });
});
