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
    expect(screen.getAllByText("Not returned").length).toBeGreaterThan(0);
  });
});
