import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingDetailDecisionSummary } from "./FindingDetailDecisionSummary";

describe("FindingDetailDecisionSummary", () => {
  it("renders compact executive decision fields", () => {
    render(
      <FindingDetailDecisionSummary
        summary={{
          severity: "High",
          disposition: "Accepted with monitoring",
          businessImpact: "Non-blocking for package approval",
          requiredMonitoring: "Weekly exception monitoring",
          evidenceConfidenceLabel: "High confidence",
          evidenceConfidenceLevel: "High",
          nextReview: "Q3 2026",
          riskOwner: "Claims architecture lead",
        }}
      />,
    );

    expect(screen.getByTestId("finding-detail-decision-summary")).toBeTruthy();
    expect(screen.getByText("High")).toBeTruthy();
    expect(screen.getByText("Accepted with monitoring")).toBeTruthy();
    expect(screen.getByText("Non-blocking for package approval")).toBeTruthy();
    expect(screen.getByText("Weekly exception monitoring")).toBeTruthy();
    expect(screen.getByText("Q3 2026")).toBeTruthy();
    expect(screen.getByText("Claims architecture lead")).toBeTruthy();
  });
});
