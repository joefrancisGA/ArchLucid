import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import html2canvas from "html2canvas";

import { GraphLoadedExperience } from "@/app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience";
import type { GraphViewModel } from "@/types/graph";

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/evidence-graph",
  useSearchParams: () => new URLSearchParams("runId=review-001"),
}));

vi.mock("@/app/(operator)/insights/evidence-graph/_sections/GraphInteractiveCanvas", () => ({
  GraphInteractiveCanvas: () => <div id="knowledge-graph-canvas" data-testid="graph-interactive-canvas" />,
}));

vi.mock("html2canvas", () => ({ default: vi.fn() }));

vi.mock("@/app/(operator)/insights/evidence-graph/_sections/EvidenceTrailTracePanel", () => ({
  EvidenceTrailTracePanel: () => <div data-testid="evidence-trail-trace-panel" />,
}));

const graph: GraphViewModel = {
  nodes: [{ id: "n1", label: "Decision", type: "Decision" }],
  edges: [],
  nodeCount: 1,
  edgeCount: 0,
};

describe("GraphLoadedExperience (LD-14)", () => {
  it("defaults Working operator shell to the trace list panel", () => {
    render(
      <GraphLoadedExperience
        buyerPolishedShell={false}
        graphMainColumnMaxClass="max-w-5xl"
        graph={graph}
        demoUi={false}
        graphSurfaceKey="review-001-1-0"
        typeFilter=""
        onTypeFilterChange={vi.fn()}
        nodeTypes={["Decision"]}
        runId="review-001"
        mode="provenance-full"
        onModeChange={vi.fn()}
        loading={false}
        graphInteractiveReady
        onGraphInteractiveSurfaceReady={vi.fn()}
        controls={<div data-testid="graph-page-controls" />}
        presentationView="trace"
        onPresentationViewChange={vi.fn()}
        operatorListFirst
      />,
    );

    expect(screen.getByTestId("graph-presentation-panel-trace")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-trail-trace-panel")).toBeInTheDocument();
    expect(screen.getByTestId("graph-presentation-tabs")).toBeInTheDocument();
    expect(screen.queryByTestId("graph-interactive-canvas")).toBeNull();
  });

  it("shows PNG export disclaimer near export controls", () => {
    render(
      <GraphLoadedExperience
        buyerPolishedShell={false}
        graphMainColumnMaxClass="max-w-5xl"
        graph={graph}
        demoUi={false}
        graphSurfaceKey="review-001-1-0"
        typeFilter=""
        onTypeFilterChange={vi.fn()}
        nodeTypes={["Decision"]}
        runId="review-001"
        mode="provenance-full"
        onModeChange={vi.fn()}
        loading={false}
        graphInteractiveReady
        onGraphInteractiveSurfaceReady={vi.fn()}
        controls={<div data-testid="graph-page-controls" />}
        presentationView="graph"
        onPresentationViewChange={vi.fn()}
        operatorListFirst={false}
      />,
    );

    expect(screen.getByTestId("graph-png-export-disclaimer")).toHaveTextContent(/viewport snapshot/i);
    expect(screen.getByTestId("graph-png-export-disclaimer")).toHaveTextContent(/not a sealed attestation/i);
  });

  it("shows the canvas when Working operator shell switches to graph view", () => {
    render(
      <GraphLoadedExperience
        buyerPolishedShell={false}
        graphMainColumnMaxClass="max-w-5xl"
        graph={graph}
        demoUi={false}
        graphSurfaceKey="review-001-1-0"
        typeFilter=""
        onTypeFilterChange={vi.fn()}
        nodeTypes={["Decision"]}
        runId="review-001"
        mode="provenance-full"
        onModeChange={vi.fn()}
        loading={false}
        graphInteractiveReady
        onGraphInteractiveSurfaceReady={vi.fn()}
        controls={<div data-testid="graph-page-controls" />}
        presentationView="graph"
        onPresentationViewChange={vi.fn()}
        operatorListFirst
      />,
    );

    expect(screen.getByTestId("graph-presentation-panel-graph")).toBeInTheDocument();
    expect(screen.getByTestId("graph-interactive-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("evidence-trail-trace-panel")).toBeNull();
  });

  it("ignores an older PNG raster failure after the latest export succeeds", async () => {
    let rejectOlder!: (reason: Error) => void;
    const older = new Promise<HTMLCanvasElement>((_, reject) => { rejectOlder = reject; });
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,AA==");
    vi.mocked(html2canvas).mockReturnValueOnce(older).mockResolvedValueOnce(canvas);
    const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    try {
      render(
        <GraphLoadedExperience
          buyerPolishedShell={false}
          graphMainColumnMaxClass="max-w-5xl"
          graph={graph}
          demoUi={false}
          graphSurfaceKey="review-001-1-0"
          typeFilter=""
          onTypeFilterChange={vi.fn()}
          nodeTypes={["Decision"]}
          runId="review-001"
          manifestVersion="v12"
          mode="provenance-full"
          onModeChange={vi.fn()}
          loading={false}
          graphInteractiveReady
          onGraphInteractiveSurfaceReady={vi.fn()}
          controls={<div />}
          presentationView="graph"
          operatorListFirst={false}
        />,
      );
      const pngButton = screen.getByRole("button", { name: "Download the visible graph as PNG" });
      fireEvent.click(pngButton);
      await waitFor(() => expect(html2canvas).toHaveBeenCalledTimes(1));
      fireEvent.click(pngButton);
      await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
      await act(async () => { rejectOlder(new Error("Rasterizer failed")); });
      expect(screen.queryByTestId("graph-png-raster-failure-not-empty-graph")).not.toBeInTheDocument();
    } finally {
      download.mockRestore();
      vi.mocked(html2canvas).mockReset();
    }
  });
});
