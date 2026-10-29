import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DiagramNeighborhoodMapView } from "@/components/architecture/DiagramNeighborhoodMapView";

const map = {
  neighborhoods: [
    {
      id: "vnet:app",
      kind: "vnet",
      title: "app-vnet",
      resourceCount: 4,
      memberIds: ["vm-a"],
      frameIds: ["vnet-app"],
      types: [{ name: "virtualMachines", count: 2 }],
    },
    {
      id: "shared:security",
      kind: "shared",
      title: "security",
      resourceCount: 1,
      memberIds: ["vault"],
      frameIds: ["rg-security"],
      types: [{ name: "vaults", count: 1 }],
    },
  ],
  links: [{ from: "shared:security", to: "vnet:app", count: 1 }],
};

describe("DiagramNeighborhoodMapView", () => {
  it("renders tiles and opens the clicked neighborhood", () => {
    const onOpenNeighborhood = vi.fn();
    render(<DiagramNeighborhoodMapView map={map} onOpenNeighborhood={onOpenNeighborhood} />);

    expect(screen.getByTestId("architecture-diagram-neighborhood-tile-vnet:app")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Virtual networks" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resource groups" })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-virtual-networks")).toContainElement(
      screen.getByTestId("architecture-diagram-neighborhood-tile-vnet:app"),
    );
    expect(screen.getByTestId("architecture-diagram-resource-groups")).toContainElement(
      screen.getByTestId("architecture-diagram-neighborhood-tile-shared:security"),
    );
    expect(screen.getByText("app-vnet")).toBeInTheDocument();
    expect(screen.getByText("app-vnet")).not.toHaveAttribute("title");
    expect(screen.getByText("4 resources")).toBeInTheDocument();
    expect(screen.getByText(
      "These cards summarize neighborhoods. They do not list every resource. Relationship lines are on the full plate, not on the cards.",
    )).toBeInTheDocument();
    expect(screen.getByText("security — 1 stored link — app-vnet")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-diagram-neighborhood-tile-vnet:app"));
    expect(onOpenNeighborhood).toHaveBeenCalledWith("vnet:app");
  });

  it("uses the same border styling on virtual network and resource group tiles", () => {
    render(<DiagramNeighborhoodMapView map={map} onOpenNeighborhood={vi.fn()} />);

    const vnetTile = screen.getByTestId("architecture-diagram-neighborhood-tile-vnet:app");
    const resourceGroupTile = screen.getByTestId("architecture-diagram-neighborhood-tile-shared:security");

    expect(vnetTile.className).toBe(resourceGroupTile.className);
    expect(vnetTile.className).toContain("border-slate-200");
  });

  it("keeps shared services out of the resource group section", () => {
    render(
      <DiagramNeighborhoodMapView
        map={{
          neighborhoods: [
            {
              id: "vnet:app",
              kind: "vnet",
              title: "app-vnet",
              resourceCount: 2,
              memberIds: ["vm-a"],
              frameIds: ["vnet-app"],
              types: [],
            },
            {
              id: "remainder:rg-app",
              kind: "remainder",
              title: "rg-app",
              resourceCount: 3,
              memberIds: ["app"],
              frameIds: ["rg-app"],
              types: [],
            },
            {
              id: "other-resource-groups",
              kind: "other",
              title: "Other resource groups",
              resourceCount: 8,
              memberIds: ["other-resource-groups-rollup"],
              frameIds: ["rg-other"],
              types: [],
            },
            {
              id: "shared-services",
              kind: "shared-services",
              title: "Shared services",
              resourceCount: 1,
              memberIds: ["vault"],
              frameIds: ["shared-services"],
              types: [{ name: "key vaults", count: 1 }],
            },
          ],
          links: [],
        }}
        onOpenNeighborhood={vi.fn()}
      />,
    );

    const resourceGroups = screen.getByTestId("architecture-diagram-resource-groups");
    expect(resourceGroups).toContainElement(
      screen.getByTestId("architecture-diagram-neighborhood-tile-remainder:rg-app"),
    );
    expect(resourceGroups).toContainElement(
      screen.getByTestId("architecture-diagram-neighborhood-tile-other-resource-groups"),
    );
    expect(resourceGroups).not.toContainElement(
      screen.getByTestId("architecture-diagram-neighborhood-tile-shared-services"),
    );
    expect(screen.getByRole("heading", { name: "Shared services" })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-shared-services")).toContainElement(
      screen.getByTestId("architecture-diagram-neighborhood-tile-shared-services"),
    );
  });

  it("summarizes links after the twelfth row", () => {
    const links = Array.from({ length: 13 }, (_, index) => ({
      from: "vnet:app",
      to: "shared:security",
      count: index + 1,
    }));
    render(<DiagramNeighborhoodMapView map={{ ...map, links }} onOpenNeighborhood={vi.fn()} />);

    expect(screen.getByText("1 stored link are not listed in this preview.")).toBeInTheDocument();
  });

  it("distinguishes missing counts from stored zero", () => {
    render(
      <DiagramNeighborhoodMapView
        map={{
          neighborhoods: [{
            ...map.neighborhoods[0],
            resourceCount: null,
            types: [{ name: "virtualMachines", count: null }],
          }, {
            ...map.neighborhoods[1],
            resourceCount: 0,
            types: [{ name: "virtualMachines", count: 0 }],
          }],
          links: [],
        }}
        onOpenNeighborhood={vi.fn()}
      />,
    );

    expect(screen.getByText("Resource count was not stored")).toBeInTheDocument();
    expect(screen.getByText("virtualMachines count was not stored")).toBeInTheDocument();
    expect(screen.getByText("0 resources")).toBeInTheDocument();
    expect(screen.getByText("virtualMachines 0")).toBeInTheDocument();
  });

  it("distinguishes omitted link counts and titles from stored empty values", () => {
    render(
      <DiagramNeighborhoodMapView
        map={{
          neighborhoods: [{ ...map.neighborhoods[0], title: null }],
          links: [
            { from: "vnet:app", to: "vnet:app", count: null },
            { from: "vnet:app", to: "vnet:app", count: 0 },
          ],
        }}
        onOpenNeighborhood={vi.fn()}
      />,
    );

    expect(screen.getByText("Neighborhood title was not stored.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Neighborhood title was not stored — Link count was not stored — Neighborhood title was not stored",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Neighborhood title was not stored — 0 stored links — Neighborhood title was not stored"),
    ).toBeInTheDocument();
  });

  it("labels missing kinds and type names without changing stored counts", () => {
    render(
      <DiagramNeighborhoodMapView
        map={{
          neighborhoods: [{
            ...map.neighborhoods[0],
            kind: null,
            types: [{ name: null, count: 0 }, { name: "", count: 2 }],
          }],
          links: [],
        }}
        onOpenNeighborhood={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Neighborhood kind was not stored." })).toBeInTheDocument();
    expect(screen.getByText("Type name was not stored 0")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-neighborhood-tile-vnet:app")).toHaveTextContent("2");
  });
});
