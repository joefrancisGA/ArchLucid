import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";

import { InfraEvidenceDiagramOutline } from "@/components/infra-evidence/InfraEvidenceDiagramOutline";
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
      source: "observed",
      confidenceBand: "observed",
      provenanceKind: null,
      inferenceSource: null,
      declaredConnectionId: null,
    },
  ],
};

function getNodesTable(): HTMLTableElement {
  const panel = screen.getByTestId("infra-diagrams-outline-nodes-panel");

  return within(panel).getByRole("table");
}

function getEdgesTable(): HTMLTableElement {
  const panel = screen.getByTestId("infra-diagrams-outline-edges-panel");

  return within(panel).getByRole("table");
}

function getFirstConnectedDataRow(table: HTMLTableElement): HTMLTableRowElement {
  const rows = within(table).getAllByRole("row");
  let passedConnectedHeader = false;

  for (const row of rows) {
    if (row.textContent?.startsWith("Connected nodes")) {
      passedConnectedHeader = true;
      continue;
    }

    if (row.textContent?.startsWith("Unconnected nodes")) {
      break;
    }

    if (passedConnectedHeader) {
      return row;
    }
  }

  throw new Error("No connected data row found");
}

function countNodeDataRows(table: HTMLTableElement): number {
  return within(table)
    .getAllByRole("row")
    .filter(
      (row) =>
        !row.textContent?.startsWith("Connected nodes")
        && !row.textContent?.startsWith("Unconnected nodes")
        && row.querySelector("th") === null,
    ).length;
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
    expect(within(edgesTable).getByText("—")).toBeTruthy();

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
    expect(within(edgesTable).getByText("n_missing")).toBeTruthy();
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
    expect(within(edgesTable).getByText("peering")).toBeTruthy();
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

  it("uses full-outline counts before truncating node rows", () => {
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

    expect(within(nodesTable).getByText("Connected nodes (2)")).toBeTruthy();
    expect(within(nodesTable).getByText("Unconnected nodes (1)")).toBeTruthy();
    expect(screen.queryByTestId("infra-diagrams-outline-nodes-truncated")).toBeNull();
  });

  it("shows truncation metadata and caps visible node rows at 200", () => {
    const manyNodeOutline: InfraEvidenceMermaidOutline = {
      nodes: Array.from({ length: 201 }, (_, index) => ({
        id: `n_${index}`,
        label: `node-${String(index).padStart(3, "0")}`,
        resourceType: "Microsoft.Storage/storageAccounts",
        resourceGroup: `rg-${index}`,
      })),
      edges: [
        {
          from: "n_0",
          to: "n_1",
          label: null,
          source: "observed",
          confidenceBand: "observed",
          provenanceKind: null,
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    };

    render(<InfraEvidenceDiagramOutline outline={manyNodeOutline} defaultNodesOpen={true} />);

    const nodesTable = getNodesTable();

    expect(within(nodesTable).getByText("Connected nodes (2)")).toBeTruthy();
    expect(within(nodesTable).getByText("Unconnected nodes (199)")).toBeTruthy();
    expect(countNodeDataRows(nodesTable)).toBeLessThanOrEqual(200);
    expect(screen.getByTestId("infra-diagrams-outline-nodes-truncated")).toHaveTextContent(
      "Showing 200 of 201 nodes.",
    );
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

    expect(within(edgesTable).getAllByRole("row")[1]?.textContent).toContain("alpha-node");

    fireEvent.click(fromHeader);

    expect(within(edgesTable).getAllByRole("row")[1]?.textContent).toContain("gamma-node");
    expect(fromHeader).toHaveAttribute("aria-label", "Sort by From, descending");

    fireEvent.click(relationshipHeader);

    expect(within(edgesTable).getAllByRole("row")[1]?.textContent).toContain("alpha-node");
    expect(relationshipHeader).toHaveAttribute("aria-label", "Sort by Relationship, ascending");

    fireEvent.click(toHeader);

    expect(within(edgesTable).getAllByRole("row")[1]?.textContent).toContain("alpha-node");
    expect(toHeader).toHaveAttribute("aria-label", "Sort by To, ascending");
  });
});
