import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { GraphViewer } from "./GraphViewer";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

describe("GraphViewer", () => {
  it("renders graph chrome and selection prompt when the graph has nodes (operator default)", async () => {
    const graph = {
      nodes: [{ id: "n1", label: "Service A", type: "Service", metadata: { region: "east" } }],
      edges: [] as { source: string; target: string; type: string }[],
    };

    render(<GraphViewer graph={graph} />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Select a node or inferred edge on the canvas to inspect reasoning and metadata.",
        ),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Graph Settings" })).toBeInTheDocument();
    expect(screen.queryByText("Node detail")).not.toBeInTheDocument();
  });

  it("renders empty-state when the graph has no nodes", () => {
    render(<GraphViewer graph={{ nodes: [], edges: [] }} />);

    expect(
      screen.getByText(/No graph data to display/),
    ).toBeInTheDocument();
  });

  it("names buyer canvas controls and enables path actions after default selection resolves", async () => {
    const graph = {
      nodes: [
        { id: "finding-1", label: "Primary finding", type: "Finding" },
        { id: "manifest-1", label: "Signed package", type: "GoldenManifest" },
      ],
      edges: [{ source: "finding-1", target: "manifest-1", type: "derived_from" }],
    };

    render(
      <GraphViewer
        graph={graph}
        presentation="buyerTrail"
        defaultSelectedNodeId="finding-1"
      />,
    );

    const toolbar = await screen.findByRole("group", { name: "Graph canvas controls" });

    await waitFor(() => {
      expect(within(toolbar).getByRole("button", { name: "Highlight path" })).toBeEnabled();
      expect(within(toolbar).getByRole("button", { name: "Focus selection" })).toBeEnabled();
    });
  });
});
