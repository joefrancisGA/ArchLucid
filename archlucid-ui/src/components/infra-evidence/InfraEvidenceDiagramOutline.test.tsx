import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";

import { InfraEvidenceDiagramOutline } from "@/components/infra-evidence/InfraEvidenceDiagramOutline";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

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
  edges: [{ from: "n_src", to: "n_missing", label: null }],
};

describe("InfraEvidenceDiagramOutline", () => {
  it("shows edge relationship labels in the Edges table", () => {
    render(<InfraEvidenceDiagramOutline outline={outline} />);

    const root = screen.getByTestId("infra-diagrams-mermaid-outline");
    const edgesHeading = screen.getByRole("heading", { name: "Edges" });
    const edgesTable = edgesHeading.parentElement?.querySelector("table");
    const nodesHeading = screen.getByRole("heading", { name: "Nodes" });
    const nodesTable = nodesHeading.parentElement?.querySelector("table");

    expect(root).toBeTruthy();
    expect(edgesTable).not.toBeNull();
    expect(nodesTable).not.toBeNull();

    expect(within(edgesTable as HTMLTableElement).getByRole("columnheader", { name: "Relationship" })).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByRole("columnheader", { name: "From" })).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByRole("columnheader", { name: "To" })).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByText("—")).toBeTruthy();

    expect(within(nodesTable as HTMLTableElement).getByRole("button", { name: "Sort by Label, ascending" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByRole("button", { name: "Sort by Resource type" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByRole("button", { name: "Sort by Resource group" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).queryByRole("columnheader", { name: "Id" })).toBeNull();
    expect(within(nodesTable as HTMLTableElement).getByText("core-vnet")).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByText("Virtual Network")).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).queryByText("(Virtual Network)")).toBeNull();
    expect(within(nodesTable as HTMLTableElement).queryByText("Microsoft.Network/virtualNetworks")).toBeNull();
    expect(within(nodesTable as HTMLTableElement).getByText("rg-network")).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByText("core-vnet")).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByText("n_missing")).toBeTruthy();
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
      edges: [{ from: "n_pe", to: "n_cosmos", label: "connects" }],
    };

    render(<InfraEvidenceDiagramOutline outline={privateEndpointOutline} />);

    const edgesHeading = screen.getByRole("heading", { name: "Edges" });
    const edgesTable = edgesHeading.parentElement?.querySelector("table");

    expect(edgesTable).not.toBeNull();

    const cells = within(edgesTable as HTMLTableElement).getAllByRole("cell");

    expect(cells.map((cell) => cell.textContent)).toEqual([
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
      edges: [{ from: "n_a", to: "n_b", label: null }],
    };

    render(<InfraEvidenceDiagramOutline outline={peeringOutline} />);

    const edgesHeading = screen.getByRole("heading", { name: "Edges" });
    const edgesTable = edgesHeading.parentElement?.querySelector("table");

    expect(edgesTable).not.toBeNull();
    expect(within(edgesTable as HTMLTableElement).getByText("peering")).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).queryByText("—")).toBeNull();
  });

  it("focuses a neighborhood from a Nodes row", () => {
    const onFocusNeighborhood = vi.fn();

    render(<InfraEvidenceDiagramOutline outline={outline} onFocusNeighborhood={onFocusNeighborhood} />);

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
    render(<InfraEvidenceDiagramOutline outline={outline} />);

    const nodesHeading = screen.getByRole("heading", { name: "Nodes" });
    const nodesTable = nodesHeading.parentElement?.querySelector("table");

    expect(nodesTable).not.toBeNull();

    const labelHeader = within(nodesTable as HTMLTableElement).getByRole("button", { name: "Sort by Label, ascending" });
    const resourceTypeHeader = within(nodesTable as HTMLTableElement).getByRole("button", {
      name: "Sort by Resource type",
    });
    const resourceGroupHeader = within(nodesTable as HTMLTableElement).getByRole("button", {
      name: "Sort by Resource group",
    });

    expect(within(nodesTable as HTMLTableElement).getAllByRole("row")[1]?.textContent).toContain("app-storage");
    expect(labelHeader).toHaveAttribute("aria-label", "Sort by Label, ascending");

    fireEvent.click(labelHeader);

    expect(within(nodesTable as HTMLTableElement).getAllByRole("row")[1]?.textContent).toContain("core-vnet");
    expect(labelHeader).toHaveAttribute("aria-label", "Sort by Label, descending");

    fireEvent.click(labelHeader);

    expect(within(nodesTable as HTMLTableElement).getAllByRole("row")[1]?.textContent).toContain("app-storage");
    expect(labelHeader).toHaveAttribute("aria-label", "Sort by Label, ascending");

    fireEvent.click(resourceTypeHeader);

    expect(within(nodesTable as HTMLTableElement).getAllByRole("row")[1]?.textContent).toContain("app-storage");
    expect(resourceTypeHeader).toHaveAttribute("aria-label", "Sort by Resource type, ascending");

    fireEvent.click(resourceTypeHeader);

    expect(within(nodesTable as HTMLTableElement).getAllByRole("row")[1]?.textContent).toContain("core-vnet");
    expect(resourceTypeHeader).toHaveAttribute("aria-label", "Sort by Resource type, descending");

    fireEvent.click(resourceGroupHeader);

    expect(within(nodesTable as HTMLTableElement).getAllByRole("row")[1]?.textContent).toContain("app-storage");
    expect(resourceGroupHeader).toHaveAttribute("aria-label", "Sort by Resource group, ascending");
  });
});
