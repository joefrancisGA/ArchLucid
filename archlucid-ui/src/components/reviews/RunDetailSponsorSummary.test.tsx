import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailSponsorSummary } from "@/components/reviews/RunDetailSponsorSummary";

describe("RunDetailSponsorSummary", () => {
  it("renders one authoritative sponsor report block", () => {
    render(
      <RunDetailSponsorSummary
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

    expect(screen.getByTestId("run-detail-sponsor-report")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sponsor report" })).toBeInTheDocument();
    expect(screen.getByText("Complete for this review")).toBeInTheDocument();
    expect(screen.getAllByText("Approved with monitoring").length).toBeGreaterThan(0);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
