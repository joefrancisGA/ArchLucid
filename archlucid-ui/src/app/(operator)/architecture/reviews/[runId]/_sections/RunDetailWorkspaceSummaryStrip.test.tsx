import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailWorkspaceSummaryStrip } from "./RunDetailWorkspaceChrome";

describe("RunDetailWorkspaceSummaryStrip", () => {
  it("renders compact review status summary for the first viewport", () => {
    render(
      <RunDetailWorkspaceSummaryStrip
        outcomeHeading="Governance decision"
        reviewOutcome="Approved with monitoring"
        highestUnresolvedSeverity="High"
        findingsSummaryLine="1 open · 1 blocks approval"
        evidenceCoverageLine="1 of 1 open finding has linked evidence"
        primaryConcern="PHI Minimization Risk"
        nextAction="Confirm evidence and remediation ownership for the open high-severity finding"
      />,
    );

    expect(screen.getByTestId("run-detail-workspace-summary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Decision snapshot" })).toBeInTheDocument();
    expect(screen.getByText("Approved with monitoring")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("1 of 1 open finding has linked evidence")).toBeInTheDocument();
    expect(screen.getByText("PHI Minimization Risk")).toBeInTheDocument();
    expect(screen.getByText(/Confirm evidence and remediation ownership/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open findings" })).toBeNull();
  });
});
