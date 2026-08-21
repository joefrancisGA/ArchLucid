import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

import { RunDetailOutcomeCards } from "@/components/runs/RunDetailOutcomeCards";

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

  it("demotes buyer package strip links when Do this next owns the page primary", () => {
    render(
      <RunDetailOutcomeCards
        runId="run-1"
        manifestId="manifest-1"
        hasGoldenManifest
        findingCountDisplay={1}
        warningCountDisplay={0}
        artifactCount={2}
        unresolvedIssueCountDisplay={0}
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(screen.getByTestId("run-detail-finalized-package-link").className).toContain("text-al-text-secondary");
  });

  it("labels package finalization as package state rather than review outcome", () => {
    render(
      <RunDetailOutcomeCards
        runId="run-1"
        manifestId="manifest-1"
        hasGoldenManifest
        findingCountDisplay={1}
        warningCountDisplay={0}
        artifactCount={2}
        unresolvedIssueCountDisplay={0}
        governanceGateLabel="No governance decision recorded"
      />,
    );

    expect(screen.getByText("Package state")).toBeInTheDocument();
    expect(screen.queryByText("Review outcome")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Package state: finalized")).toBeInTheDocument();
  });
});
