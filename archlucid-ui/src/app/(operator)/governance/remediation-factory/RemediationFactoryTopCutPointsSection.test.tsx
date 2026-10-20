import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SecurityEvidencePathCutPoint } from "@/lib/security-evidence-path-types";

import { RemediationFactoryTopCutPointsSection } from "./RemediationFactoryTopCutPointsSection";

function baseCutPoint(overrides: Partial<SecurityEvidencePathCutPoint> = {}): SecurityEvidencePathCutPoint {
  return {
    cutPointId: "cut-1",
    cutKind: "Node",
    cutOrder: 1,
    fromNodeLabel: "mi-worker",
    toNodeLabel: null,
    edgeType: null,
    explanationSummary: "SA10-cut-v1: removing node mi-worker collapses 3 ranked path(s).",
    suggestedPatternKey: "network.restrict-public",
    operationalCostClass: "RoleAssignment",
    pathsCollapsedCount: 3,
    leverageScore: 9,
    collapsedPathIds: ["11111111-1111-1111-1111-111111111111"],
    ...overrides,
  };
}

describe("RemediationFactoryTopCutPointsSection", () => {
  it("renders cut points and selects a collapsed path", () => {
    const onSelectPath = vi.fn();

    render(
      <RemediationFactoryTopCutPointsSection
        cutPoints={[baseCutPoint()]}
        isLoading={false}
        isError={false}
        isFetching={false}
        isSuccess={true}
        refetch={vi.fn()}
        selectedPathId={null}
        onSelectPath={onSelectPath}
      />,
    );

    expect(screen.getByTestId("remediation-factory-top-cut-points")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-top-cut-point-1")).toHaveTextContent("mi-worker");
    expect(screen.getByRole("link", { name: "network.restrict-public" })).toHaveAttribute(
      "href",
      "/insights/patterns/network.restrict-public",
    );

    fireEvent.click(screen.getByRole("button", { name: "Highlight path" }));
    expect(onSelectPath).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
  });

  it("shows empty state when no cut points", () => {
    render(
      <RemediationFactoryTopCutPointsSection
        cutPoints={[]}
        isLoading={false}
        isError={false}
        isFetching={false}
        isSuccess={true}
        refetch={vi.fn()}
        selectedPathId={null}
        onSelectPath={vi.fn()}
      />,
    );

    expect(screen.getByText(/No cut points were computed/)).toBeInTheDocument();
  });
});
