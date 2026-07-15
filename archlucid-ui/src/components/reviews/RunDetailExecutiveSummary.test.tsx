import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailExecutiveSummary } from "@/components/reviews/RunDetailExecutiveSummary";

describe("RunDetailExecutiveSummary", () => {
  it("renders one authoritative executive summary block", () => {
    render(
      <RunDetailExecutiveSummary
        workspaceStatus={{ label: "Approved", kind: "approved", statusTagKind: "approved" }}
        overallPosture="Approved with monitoring"
        highestSeverity="High"
        criticalCount={0}
        highCount={1}
        awaitingActionCount={1}
        governanceDecisionLabel="Approved with monitoring"
        evidenceCoverageLabel="Complete for this review"
        lastEvaluatedUtc="2026-07-01T12:00:00Z"
      />,
    );

    expect(screen.getByTestId("run-detail-executive-summary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Executive summary" })).toBeInTheDocument();
    expect(screen.getByText("Complete for this review")).toBeInTheDocument();
    expect(screen.getAllByText("Approved with monitoring").length).toBeGreaterThan(0);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
