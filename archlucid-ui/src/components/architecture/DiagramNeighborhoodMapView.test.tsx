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
    expect(screen.getByText("security — 1 — app-vnet")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-diagram-neighborhood-tile-vnet:app"));
    expect(onOpenNeighborhood).toHaveBeenCalledWith("vnet:app");
  });

  it("summarizes links after the twelfth row", () => {
    const links = Array.from({ length: 13 }, (_, index) => ({
      from: "vnet:app",
      to: "shared:security",
      count: index + 1,
    }));
    render(<DiagramNeighborhoodMapView map={{ ...map, links }} onOpenNeighborhood={vi.fn()} />);

    expect(screen.getByText("+ 1 more links")).toBeInTheDocument();
  });
});
