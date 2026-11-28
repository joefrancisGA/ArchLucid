import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailFindingCoverageDispositionPanel } from "@/components/runs/RunDetailFindingCoverageDispositionPanel";

describe("RunDetailFindingCoverageDispositionPanel (P-02 / P-03)", () => {
  it.each([
    "Requirement comparison completed with no findings.",
    "Requirement comparison exhausted its retry budget. Coverage remains incomplete.",
    "Requirement comparison recovered after a retry and returned no findings.",
  ])("renders the stored engine outcome even without disposition counts (%s)", (note) => {
    const summary = { findingEngineRecoveryNote: note, hasCommitBlockingFailures: false };
    render(<RunDetailFindingCoverageDispositionPanel summary={summary} />);
    expect(screen.getByTestId("finding-engine-recovery-note")).toHaveTextContent(note);
  });

  it("shows Not returned for omitted disposition counts and engine fields", () => {
    render(
      <RunDetailFindingCoverageDispositionPanel
        summary={{
          hasCommitBlockingFailures: false,
          enginesSucceeded: null,
          enginesAttempted: null,
          enginesFailed: null,
          dispositionCoverage: {
            openCount: null,
            acceptedCount: 0,
            remediatedCount: 0,
            deferredCount: 0,
            needsEvidenceCount: 0,
            rejectedNotApplicableCount: 0,
            waivedCount: 0,
          },
        }}
      />,
    );

    expect(screen.getByText("Engine succeeded count was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Open count was not stored.")).toBeInTheDocument();
    expect(screen.queryByText("Rejected / N/A")).not.toBeInTheDocument();
  });

  it("shows omission when disposition coverage is missing (P-17)", () => {
    render(
      <RunDetailFindingCoverageDispositionPanel
        summary={{
          hasCommitBlockingFailures: false,
          enginesSucceeded: 2,
          enginesAttempted: 2,
          enginesFailed: 0,
          dispositionCoverage: null,
        }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Engines 2/2 succeeded");
    expect(screen.getByText("Finding disposition counts were not stored.")).toBeInTheDocument();
  });

  it("keeps the finalization warning when disposition counts are absent", () => {
    render(
      <RunDetailFindingCoverageDispositionPanel
        summary={{
          hasCommitBlockingFailures: true,
          enginesSucceeded: 1,
          enginesAttempted: 2,
          enginesFailed: 1,
          dispositionCoverage: null,
        }}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Commit-blocking finding coverage");
    expect(alert).toHaveTextContent("Engines 1/2 succeeded · 1 failed");
    expect(alert).toHaveTextContent(/Finalization should remain blocked/);
    expect(alert).toHaveTextContent("Finding disposition counts were not stored.");
  });

  it("states when commit-blocking flag was not stored (P-18)", () => {
    render(
      <RunDetailFindingCoverageDispositionPanel
        summary={{
          hasCommitBlockingFailures: undefined,
          enginesSucceeded: 2,
          enginesAttempted: 2,
          enginesFailed: 0,
          dispositionCoverage: {
            openCount: 0,
            acceptedCount: 0,
            remediatedCount: 0,
            deferredCount: 0,
            needsEvidenceCount: 0,
            rejectedNotApplicableCount: 0,
            waivedCount: 0,
          },
        }}
      />,
    );

    expect(screen.getByText(/Commit-blocking coverage flag was not stored/i)).toBeInTheDocument();
  });
});

describe("DegradedFindingCoverageBanner", () => {
  it("does not invent failed engine labels when the list is empty (P-17)", async () => {
    const { DegradedFindingCoverageBanner } = await import(
      "@/components/runs/RunDetailFindingCoverageDispositionPanel"
    );

    render(<DegradedFindingCoverageBanner failedEngineLabels={[]} />);

    expect(screen.getByText(/Failed finding-engine labels were not stored/i)).toBeInTheDocument();
    expect(screen.queryByText(/one or more finding engines/i)).not.toBeInTheDocument();
  });
});
