import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailWorkspaceSummaryStrip } from "./RunDetailWorkspaceChrome";

describe("RunDetailWorkspaceSummaryStrip", () => {
  it("renders compact review status summary for the first viewport", () => {
    render(
      <RunDetailWorkspaceSummaryStrip
        outcomeHeading="Approval decision"
        reviewOutcome="Approved with monitoring"
        highestUnresolvedSeverity="High"
        findingsSummaryLine="1 open · 1 blocks approval"
        evidenceCoverageLine="1 of 1 open finding has linked evidence"
        primaryConcern="PHI Minimization Risk"
      />,
    );

    expect(screen.getByTestId("run-detail-workspace-summary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Decision snapshot" })).toBeInTheDocument();
    expect(screen.getByText("Approved with monitoring")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("1 of 1 open finding has linked evidence")).toBeInTheDocument();
    expect(screen.getByText("PHI Minimization Risk")).toBeInTheDocument();
    expect(screen.queryByText(/Confirm evidence and remediation ownership/)).toBeNull();
    expect(screen.queryByRole("link", { name: "Open findings" })).toBeNull();
  });

  it("suppresses metrics when the pipeline has not produced assessable outcomes", () => {
    render(
      <RunDetailWorkspaceSummaryStrip
        outcomeHeading="Review posture"
        reviewOutcome="Not assessed"
        highestUnresolvedSeverity={null}
        findingsSummaryLine="None open"
        evidenceCoverageLine="No open findings"
        primaryConcern={null}
        suppressedReason="Unavailable until the review completes. Resolve the execution failure and re-run the review."
      />,
    );

    expect(screen.getByTestId("run-detail-workspace-summary-suppressed")).toHaveTextContent(
      "Resolve the execution failure and re-run the review.",
    );
    expect(screen.queryByText("Not assessed")).not.toBeInTheDocument();
    expect(screen.queryByText("No unresolved findings")).not.toBeInTheDocument();
  });

  it("uses not-stored copy when findings snapshot was not persisted", () => {
    render(
      <RunDetailWorkspaceSummaryStrip
        outcomeHeading="Review posture"
        reviewOutcome="Not assessed"
        highestUnresolvedSeverity={null}
        findingsSummaryLine="Findings snapshot was not stored."
        evidenceCoverageLine="Evidence coverage was not stored."
        primaryConcern={null}
        hasFindingsSnapshot={false}
      />,
    );

    expect(screen.getByText("Primary concern was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Highest unresolved severity was not stored.")).toBeInTheDocument();
    expect(screen.queryByText("None")).not.toBeInTheDocument();
    expect(screen.queryByText("No unresolved findings")).not.toBeInTheDocument();
  });

  it("does not render None as a severity tag when findings snapshot reports explicit none", () => {
    render(
      <RunDetailWorkspaceSummaryStrip
        outcomeHeading="Review posture"
        reviewOutcome="Approved"
        highestUnresolvedSeverity="None"
        findingsSummaryLine="None open"
        evidenceCoverageLine="Complete"
        primaryConcern={null}
        hasFindingsSnapshot={true}
      />,
    );

    expect(screen.getByText("No unresolved severity recorded.")).toBeInTheDocument();
    expect(screen.queryByText("None")).not.toBeInTheDocument();
  });
});
