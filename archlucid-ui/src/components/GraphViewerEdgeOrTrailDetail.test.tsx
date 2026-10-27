import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  GRAPH_EDGE_REASONING_NOT_STORED,
  GRAPH_EDGE_RELATIONSHIP_NOT_STORED,
  GraphViewerEdgeOrTrailDetail,
} from "@/components/GraphViewerEdgeOrTrailDetail";
import type { GraphEdgeVm } from "@/types/graph";

const baseEdge: GraphEdgeVm = {
  source: "a",
  target: "b",
  type: "",
};

describe("GraphViewerEdgeOrTrailDetail", () => {
  it("labels empty relationship types in operator mode (P-10)", () => {
    render(<GraphViewerEdgeOrTrailDetail selectedEdge={baseEdge} buyerTrailPanel={false} />);

    expect(screen.getByText(GRAPH_EDGE_RELATIONSHIP_NOT_STORED)).toBeInTheDocument();
  });

  it("humanizes buyer-trail relationships and shows reasoning omission copy (P-15)", () => {
    render(
      <GraphViewerEdgeOrTrailDetail
        selectedEdge={{ ...baseEdge, type: "raised", reasoningTrace: "   " }}
        buyerTrailPanel={true}
      />,
    );

    expect(screen.getByText(/Flagged risk/)).toBeInTheDocument();
    expect(screen.getByText(GRAPH_EDGE_REASONING_NOT_STORED)).toBeInTheDocument();
  });
});
