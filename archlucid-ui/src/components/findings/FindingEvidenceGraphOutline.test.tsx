import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingEvidenceGraphOutline } from "@/components/findings/FindingEvidenceGraphOutline";
import type { GraphViewModel } from "@/types/graph";

const graph: GraphViewModel = {
  nodeCount: 2,
  edgeCount: 1,
  nodes: [
    { id: "n1", label: "API", type: "Service" },
    { id: "n2", label: "Database", type: "Datastore" },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", type: "reads", label: "reads" }],
};

describe("FindingEvidenceGraphOutline", () => {
  it("renders semantic table rows for graph nodes", () => {
    const view = render(<FindingEvidenceGraphOutline graph={graph} graphNodeIdsExamined={["n1"]} />);

    expect(view.getByTestId("finding-evidence-graph-outline")).toBeTruthy();
    expect(view.getByText("API")).toBeTruthy();
    expect(view.getByText("Yes")).toBeTruthy();
  });

  it("matches examined ids case-insensitively", () => {
    const view = render(<FindingEvidenceGraphOutline graph={graph} graphNodeIdsExamined={["N1"]} />);

    expect(view.getByText("Yes")).toBeTruthy();
  });

  it("labels empty graph node list explicitly", () => {
    const emptyGraph: GraphViewModel = {
      nodeCount: 0,
      edgeCount: 0,
      nodes: [],
      edges: [],
    };
    const view = render(<FindingEvidenceGraphOutline graph={emptyGraph} graphNodeIdsExamined={[]} />);

    expect(view.getByText("Graph nodes were not stored.")).toBeTruthy();
  });

  it("labels stored empty node name and type", () => {
    const emptyLabels: GraphViewModel = {
      nodeCount: 1,
      edgeCount: 0,
      nodes: [{ id: "n1", label: "", type: "" }],
      edges: [],
    };
    const view = render(<FindingEvidenceGraphOutline graph={emptyLabels} graphNodeIdsExamined={[]} />);

    expect(view.getByText("Node name was stored empty.")).toBeTruthy();
    expect(view.getByText("Node type was stored empty.")).toBeTruthy();
  });
});
