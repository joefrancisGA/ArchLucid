import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProvenancePageWorkspace } from "@/components/provenance/ProvenancePageWorkspace";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

vi.mock("next/navigation", () => ({
  usePathname: () => "/reviews/demo-run/provenance",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/provenance/ProvenanceWayfinding", () => ({
  ProvenanceWayfinding: () => <div data-testid="provenance-wayfinding" />,
}));

vi.mock("@/components/operator/OperatorDemoStaticBanner", () => ({
  OperatorDemoStaticBanner: () => <div data-testid="operator-demo-static-banner" />,
}));

const graph: ArchitectureRunProvenanceGraph = {
  runId: "demo-run",
  traceabilityGaps: [],
  timeline: [
    {
      timestampUtc: "2026-01-01T12:00:00.000Z",
      kind: "manifestCommitted",
      label: "Manifest committed",
      referenceId: "m-1",
    },
  ],
  nodes: [
    { id: "n-ctx", type: "ContextSnapshot", referenceId: "ctx-1", name: "Source context reviewed" },
    { id: "n-find", type: "Finding", referenceId: "f-1", name: "PHI minimization risk" },
    { id: "n-manifest", type: "GoldenManifest", referenceId: "m-1", name: "Signed review record" },
  ],
  edges: [
    { id: "e-1", type: "supports", fromNodeId: "n-ctx", toNodeId: "n-find" },
    { id: "e-2", type: "recorded in", fromNodeId: "n-find", toNodeId: "n-manifest" },
  ],
};

beforeEach(() => {
  globalThis.ResizeObserver = class {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(): void {
      this.callback(
        [
          {
            contentRect: {
              width: 960,
              height: 580,
              top: 0,
              left: 0,
              bottom: 580,
              right: 960,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
          } as ResizeObserverEntry,
        ],
        this,
      );
    }

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("ProvenancePageWorkspace", () => {
  it("renders section navigation for graph, timeline, and tables views", () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    expect(screen.getByTestId("provenance-wayfinding")).toBeInTheDocument();
    expect(screen.queryByTestId("provenance-sources")).toBeNull(); // TB-2092
    expect(screen.getByTestId("provenance-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review provenance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Provenance graph" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Evidence graph" })).toHaveAttribute(
      "href",
      "/insights/evidence-graph?runId=demo-run",
    );
  });

  it("synchronizes graph selection with the nodes table", async () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    await waitFor(() => {
      expect(screen.getByTestId("provenance-node-n-find")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("provenance-node-n-find"));

    await waitFor(() => {
      expect(screen.getByTestId("provenance-node-detail")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Tables" }));
    const row = document.getElementById("prov-node-row-n-find");

    expect(row?.className).toMatch(/color-mix/);
  });

  it("switches between graph, timeline, and table views", () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    expect(screen.getByTestId("provenance-graph-viewport")).toBeInTheDocument();
    expect(screen.queryByTestId("provenance-timeline-table")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Timeline" }));
    expect(screen.queryByTestId("provenance-graph-viewport")).not.toBeInTheDocument();
    expect(screen.getByTestId("provenance-timeline-table")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tables" }));
    expect(screen.queryByTestId("provenance-graph-viewport")).not.toBeInTheDocument();
    expect(screen.getByTestId("provenance-timeline-table")).toBeInTheDocument();
    expect(screen.getByTestId("provenance-nodes-table")).toBeInTheDocument();
    expect(screen.getByTestId("provenance-edges-table")).toBeInTheDocument();
  });

  it("shows sample data banner when dataOrigin is sample", () => {
    render(
      <ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} dataOrigin="sample" />,
    );

    expect(screen.getByTestId("operator-demo-static-banner")).toBeInTheDocument();
  });

  it("hides graph filters outside graph view", () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Timeline" }));
    expect(screen.queryByTestId("provenance-graph-filters")).not.toBeInTheDocument();
  });

  it("exposes view modes as a segmented group rather than tabs (TB-1664)", () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    expect(screen.getByRole("group", { name: "Provenance view" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tables" }));

    expect(screen.getByRole("button", { name: "Tables" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Timeline" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows filter notice without removing table data", () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Findings (1)" }));

    expect(
      screen.getByText(/Filters hide graph elements for focus only/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 3 nodes in the graph/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tables" }));
    expect(screen.getByTestId("provenance-nodes-table")).toBeInTheDocument();
    expect(within(screen.getByTestId("provenance-nodes-table")).getAllByRole("row").length).toBeGreaterThan(3);
  });

  it("expands the edges table by default for small graphs in Tables view", () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Tables" }));
    expect(screen.getByTestId("provenance-edges-table")).toBeInTheDocument();
  });

  it("highlights edges when an edge row is clicked", () => {
    render(<ProvenancePageWorkspace runId="demo-run" graph={graph} provenanceTraceId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Tables" }));
    const edgesTable = screen.getByTestId("provenance-edges-table");
    fireEvent.click(within(edgesTable).getByText(/Reviewed source context → PHI minimization risk/));

    const highlightedRow = within(edgesTable).getByText(/Reviewed source context → PHI minimization risk/).closest("tr");

    expect(highlightedRow?.className).toMatch(/color-mix/);
  });
});
