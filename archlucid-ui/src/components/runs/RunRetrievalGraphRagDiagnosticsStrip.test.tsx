import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunRetrievalGraphRagDiagnosticsStrip } from "@/components/runs/RunRetrievalGraphRagDiagnosticsStrip";

describe("RunRetrievalGraphRagDiagnosticsStrip", () => {
  it("renders graph-rag metrics when neighbor chunks were added", () => {
    render(
      <RunRetrievalGraphRagDiagnosticsStrip
        summary={{
          totalGraphRagNeighborsAdded: 2,
          totalGraphRagSeedHits: 1,
          graphRagNeighborHitRate: 0.5,
          totalRetrievalTokensIn: 800,
          graphRagPilotFloorDisposition: "PASS",
        }}
      />,
    );

    expect(screen.getByTestId("run-retrieval-graph-rag-diagnostics")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("800")).toBeInTheDocument();
  });

  it("renders quality posture when graph-rag expansion used an unproven index", () => {
    render(
      <RunRetrievalGraphRagDiagnosticsStrip
        summary={{
          totalGraphRagNeighborsAdded: 2,
          totalGraphRagSeedHits: 1,
          graphRagNeighborHitRate: 0.5,
          totalRetrievalTokensIn: 800,
          graphRagPilotFloorDisposition: "PASS",
          graphRagQualityPosture: "unproven",
        }}
      />,
    );

    expect(screen.getByTestId("graph-rag-quality-posture")).toHaveTextContent("unproven");
    expect(
      screen.getByText(
        /Graph-RAG neighbor expansion ran without Azure AI Search vector posture/,
      ),
    ).toBeInTheDocument();
  });

  it("renders explicit zero graph-rag metrics as signal", () => {
    render(
      <RunRetrievalGraphRagDiagnosticsStrip
        summary={{
          totalGraphRagNeighborsAdded: 0,
          totalGraphRagSeedHits: 0,
          totalRetrievalTokensIn: 0,
        }}
      />,
    );

    expect(screen.getByTestId("run-retrieval-graph-rag-diagnostics")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
  });

  it("returns null when no graph-rag fields were returned", () => {
    const { container } = render(<RunRetrievalGraphRagDiagnosticsStrip summary={{}} />);

    expect(container.firstChild).toBeNull();
  });
});
