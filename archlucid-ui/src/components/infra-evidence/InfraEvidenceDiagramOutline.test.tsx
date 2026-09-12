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
  it("omits the unused Edges Label column and keeps node labels", () => {
    render(<InfraEvidenceDiagramOutline outline={outline} />);

    const root = screen.getByTestId("infra-diagrams-mermaid-outline");
    const edgesHeading = screen.getByRole("heading", { name: "Edges" });
    const edgesTable = edgesHeading.parentElement?.querySelector("table");
    const nodesHeading = screen.getByRole("heading", { name: "Nodes" });
    const nodesTable = nodesHeading.parentElement?.querySelector("table");

    expect(root).toBeTruthy();
    expect(edgesTable).not.toBeNull();
    expect(nodesTable).not.toBeNull();

    expect(within(edgesTable as HTMLTableElement).queryByRole("columnheader", { name: "Label" })).toBeNull();
    expect(within(edgesTable as HTMLTableElement).getByRole("columnheader", { name: "From" })).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByRole("columnheader", { name: "To" })).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).queryByText("—")).toBeNull();

    expect(within(nodesTable as HTMLTableElement).getByRole("button", { name: "Sort by Label, ascending" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByRole("button", { name: "Sort by Resource type" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByRole("button", { name: "Sort by Resource group" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).queryByRole("columnheader", { name: "Id" })).toBeNull();
    expect(within(nodesTable as HTMLTableElement).getByText("core-vnet")).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByText("Microsoft.Network/virtualNetworks")).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByText("rg-network")).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByText("core-vnet")).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByText("n_missing")).toBeTruthy();
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

    fireEvent.click(resourceGroupHeader);

    expect(within(nodesTable as HTMLTableElement).getAllByRole("row")[1]?.textContent).toContain("app-storage");
    expect(resourceGroupHeader).toHaveAttribute("aria-label", "Sort by Resource group, ascending");
  });
});
