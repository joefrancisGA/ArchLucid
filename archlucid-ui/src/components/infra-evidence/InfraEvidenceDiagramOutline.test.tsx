import { describe, expect, it } from "vitest";

import { render, screen, within } from "@testing-library/react";

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
  ],
  edges: [{ from: "n_src", to: "n_dst", label: null }],
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

    expect(within(nodesTable as HTMLTableElement).getByRole("columnheader", { name: "Label" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByRole("columnheader", { name: "Resource type" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByRole("columnheader", { name: "Resource group" })).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByText("core-vnet")).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByText("Microsoft.Network/virtualNetworks")).toBeTruthy();
    expect(within(nodesTable as HTMLTableElement).getByText("rg-network")).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByText("core-vnet")).toBeTruthy();
    expect(within(edgesTable as HTMLTableElement).getByText("n_dst")).toBeTruthy();
  });
});
