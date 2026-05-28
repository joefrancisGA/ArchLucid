import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailOutcomeCards } from "@/components/RunDetailOutcomeCards";

describe("RunDetailOutcomeCards", () => {
  it("renders commit-blocking disposition coverage when summary is present", () => {
    render(
      <RunDetailOutcomeCards
        runId="run-1"
        hasGoldenManifest={false}
        findingCountDisplay={3}
        warningCountDisplay={0}
        artifactCount={1}
        unresolvedIssueCountDisplay={1}
        degradedFindingCoverage
        failedEngineLabels={["Security"]}
        findingCoverageSummary={{
          enginesAttempted: 3,
          enginesSucceeded: 2,
          enginesFailed: 1,
          hasCommitBlockingFailures: true,
          dispositionCoverage: {
            openCount: 1,
            acceptedCount: 1,
            deferredCount: 0,
            needsEvidenceCount: 1,
            remediatedCount: 0,
            rejectedNotApplicableCount: 0,
            waivedCount: 0,
          },
        }}
      />,
    );

    expect(screen.getByTestId("degraded-finding-coverage-banner")).toHaveTextContent("Security");
    expect(screen.getByTestId("finding-coverage-disposition-panel")).toHaveTextContent(
      "Commit-blocking finding coverage",
    );
    expect(screen.getByText("Needs evidence")).toBeInTheDocument();
  });
});
