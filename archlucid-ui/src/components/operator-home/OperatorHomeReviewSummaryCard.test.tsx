import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeReviewSummaryCard } from "@/components/operator-home/OperatorHomeReviewSummaryCard";
import type { RunSummary } from "@/types/authority";

describe("OperatorHomeReviewSummaryCard", () => {
  it("renders status tag and metadata for an in-progress review", () => {
    const run: RunSummary = {
      runId: "review-001",
      projectId: "default",
      description: "Payments platform",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
      findingCount: 3,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href="/architecture/reviews/review-001"
        buyerPolishedShell
      />,
    );

    expect(screen.getByTestId("run-home-status-tag-review-001")).toHaveTextContent("Action needed");
    expect(screen.getByText("Findings")).toBeInTheDocument();
    expect(screen.getByText("3 findings")).toBeInTheDocument();
    expect(screen.getByTestId("run-home-list-insight-review-001")).toHaveTextContent(
      "3 findings ready · finalize manifest",
    );
  });

  it("renders featured showcase proof metadata with medium metadata labels (TB-1997)", () => {
    const run: RunSummary = {
      runId: "claims-intake-modernization",
      projectId: "default",
      description: "Claims Intake sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
      findingCount: 4,
      warningCount: 1,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href="/architecture/reviews/claims-intake-modernization"
        buyerPolishedShell
        variant="featured"
        primaryAction={{ href: "/architecture/reviews/claims-intake-modernization", label: "Open review" }}
      />,
    );

    expect(screen.getByTestId("runs-dashboard-buyer-proof-summary")).toBeInTheDocument();
    expect(screen.getByText("Decision: Package finalized")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open review" })).toBeInTheDocument();

    const proofMetadata = screen.getByTestId("runs-dashboard-buyer-proof-metadata");
    const emphasizedLabels = proofMetadata.querySelectorAll(".font-medium");

    expect(Array.from(emphasizedLabels).map((node) => node.textContent)).toEqual(
      expect.arrayContaining(["Evidence trail:", "Audit trail:"]),
    );
    expect(proofMetadata.textContent).toMatch(/Audit trail:\s*Complete/);
  });

  it("states the governance verdict once, on the status tag", () => {
    const run: RunSummary = {
      runId: "claims-intake-modernization",
      projectId: "default",
      description: "Claims Intake sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
      findingCount: 4,
      warningCount: 1,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href="/architecture/reviews/claims-intake-modernization"
        buyerPolishedShell
        variant="featured"
      />,
    );

    expect(screen.getByTestId("run-home-status-tag-claims-intake-modernization")).toHaveTextContent(
      "Approved with monitoring",
    );
    expect(screen.getAllByText(/Approved with monitoring/)).toHaveLength(1);
  });

  it("labels package origin so it does not read as a second verdict", () => {
    const run: RunSummary = {
      runId: "claims-intake-modernization",
      projectId: "default",
      description: "Claims Intake sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
    };

    render(
      <OperatorHomeReviewSummaryCard
        run={run}
        href="/architecture/reviews/claims-intake-modernization"
        buyerPolishedShell
      />,
    );

    const origin = screen.getByTestId("architecture-package-origin-reviewed");

    expect(origin.textContent).toMatch(/Package origin:\s*Reviewed/);
  });
});
