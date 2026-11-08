import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailFindingCoverageDispositionPanel } from "@/components/runs/RunDetailFindingCoverageDispositionPanel";

describe("RunDetailFindingCoverageDispositionPanel (P-02 / P-03)", () => {
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

    expect(screen.getByText("Finding disposition counts were not stored.")).toBeInTheDocument();
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
