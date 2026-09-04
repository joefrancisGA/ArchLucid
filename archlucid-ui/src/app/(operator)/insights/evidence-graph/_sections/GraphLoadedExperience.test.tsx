import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GraphLoadedExperience } from "@/app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience";
import type { GraphViewModel } from "@/types/graph";

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/evidence-graph",
  useSearchParams: () => new URLSearchParams("runId=review-001"),
}));

vi.mock("@/app/(operator)/insights/evidence-graph/_sections/GraphInteractiveCanvas", () => ({
  GraphInteractiveCanvas: () => <div data-testid="graph-interactive-canvas" />,
}));

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
});
