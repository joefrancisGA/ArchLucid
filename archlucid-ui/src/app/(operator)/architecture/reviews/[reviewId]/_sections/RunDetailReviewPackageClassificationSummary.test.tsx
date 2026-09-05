import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailReviewPackageClassificationSummary } from "./RunDetailReviewPackageClassificationSummary";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

function buildFinding(
  findingId: string,
  classification: QuickDecisionFinding["classification"],
): QuickDecisionFinding {
  return {
    findingId,
    title: findingId,
    severity: "medium",
    status: "open",
    classification,
    insightDensityScore: classification === "ChecklistCoverage" ? 20 : 80,
  };
}

describe("RunDetailReviewPackageClassificationSummary (IS-06)", () => {
  it("shows decision-grade and checklist counts in the stamp viewport", () => {
    render(
      <RunDetailReviewPackageClassificationSummary
        findings={[
          buildFinding("f-1", "DecisionGradeFinding"),
          buildFinding("f-2", "ChecklistCoverage"),
          buildFinding("f-3", "ChecklistCoverage"),
        ]}
      />,
    );

    expect(screen.getByTestId("run-detail-stamp-classification-summary")).toBeInTheDocument();
    expect(screen.getByText(/Decision-grade: 1/i)).toBeVisible();
    expect(screen.getByText(/Checklist: 2/i)).toBeVisible();
  });

  it("renders nothing when there are no findings", () => {
    const { container } = render(<RunDetailReviewPackageClassificationSummary findings={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
