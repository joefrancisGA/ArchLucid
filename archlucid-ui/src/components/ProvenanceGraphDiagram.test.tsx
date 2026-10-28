import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProvenanceGraphDiagram } from "@/components/ProvenanceGraphDiagram";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/graph",
  useSearchParams: () => new URLSearchParams(),
}));

describe("ProvenanceGraphDiagram node name honesty", () => {
  it("shows node name omission copy in the diagram label and detail panel", () => {
    render(
      <ProvenanceGraphDiagram
        nodes={[
          {
            id: "node-1",
            type: "Finding",
            name: "   ",
            referenceId: "finding-1",
          },
        ]}
        edges={[]}
      />,
    );

    expect(screen.getByText("Name was not stored.")).toBeInTheDocument();

    const graphGroup = screen.getByRole("img", { name: "Provenance nodes and edges" }).parentElement?.querySelector("g.cursor-pointer");

    expect(graphGroup).not.toBeNull();
    fireEvent.click(graphGroup!);

    expect(screen.getByText("Node name was not stored.")).toBeInTheDocument();
  });
});
