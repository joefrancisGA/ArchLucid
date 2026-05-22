import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FindingsWhatIfAnalysisPanel } from "./FindingsWhatIfAnalysisPanel";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

describe("FindingsWhatIfAnalysisPanel", () => {
  const dummyFindings: QuickDecisionFinding[] = [
    {
      findingId: "f1",
      title: "Test finding",
      severity: "High",
      domain: "cost",
      aiReasoning: { wireJson: '{"projectedImpactUsd": 1200}' }
    }
  ];

  it("does not render illustrative pricing badge when isIllustrativePricing is false", () => {
    render(<FindingsWhatIfAnalysisPanel findings={dummyFindings} baselineAnnualCostUsd={10000} isIllustrativePricing={false} />);
    expect(screen.queryByTestId("illustrative-pricing-badge")).not.toBeInTheDocument();
  });

  it("renders illustrative pricing badge when isIllustrativePricing is true", () => {
    render(<FindingsWhatIfAnalysisPanel findings={dummyFindings} baselineAnnualCostUsd={10000} isIllustrativePricing={true} />);
    const badge = screen.getByTestId("illustrative-pricing-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Illustrative Retail Pricing");
    expect(badge).toHaveAttribute("title", "Illustrative Retail Pricing: Actual EA discounts may vary");
  });
});
