import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunRetrievalGraphRagDiagnosticsStrip } from "@/components/RunRetrievalGraphRagDiagnosticsStrip";

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

  it("returns null when no graph-rag activity recorded", () => {
    const { container } = render(
      <RunRetrievalGraphRagDiagnosticsStrip
        summary={{
          totalGraphRagNeighborsAdded: 0,
          totalGraphRagSeedHits: 0,
          totalRetrievalTokensIn: 0,
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
