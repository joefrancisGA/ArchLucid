import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { FindingsWhatIfAnalysisPanel } from "@/components/findings/FindingsWhatIfAnalysisPanel";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

vi.mock("@/lib/demo-ui-env", () => ({
  isOperatorExperienceFullShellEnv: () => true,
}));

describe("FindingsWhatIfAnalysisPanel", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

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

  it("labels incomplete projected savings when a selected finding omits impact", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "With savings",
        severity: "High",
        domain: "cost",
        aiReasoning: { wireJson: '{"projectedImpactUsd": 500}' },
      },
      {
        findingId: "f2",
        title: "Missing savings",
        severity: "High",
        domain: "cost",
        aiReasoning: { wireJson: "{}" },
      },
    ];

    render(<FindingsWhatIfAnalysisPanel findings={findings} baselineAnnualCostUsd={10000} />);

    fireEvent.click(screen.getByLabelText("Enable what-if analysis"));
    fireEvent.click(screen.getByRole("checkbox", { name: /With savings/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Missing savings/i }));

    expect(screen.getByText(/Projected savings total is incomplete/)).toBeInTheDocument();
  });

  it("shows stored zero projected impact on a finding row", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f0",
        title: "Zero impact",
        recommendation: "No savings",
        severityValue: 1,
        findingOrder: 0,
        aiReasoning: { wireJson: '{"projectedImpactUsd":0}', reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
      },
    ];

    render(<FindingsWhatIfAnalysisPanel findings={findings} baselineAnnualCostUsd={10000} />);

    fireEvent.click(screen.getByLabelText("Enable what-if analysis"));

    expect(screen.getByText(/\$0 projected impact stored/)).toBeInTheDocument();
  });

  it("shows baseline omission copy when savings exist without a baseline (P-03)", () => {
    render(<FindingsWhatIfAnalysisPanel findings={dummyFindings} baselineAnnualCostUsd={null} />);

    expect(screen.getAllByText("Baseline annual cost was not stored.").length).toBeGreaterThanOrEqual(1);
  });

  it("renders illustrative pricing badge when isIllustrativePricing is true", () => {
    render(<FindingsWhatIfAnalysisPanel findings={dummyFindings} baselineAnnualCostUsd={10000} isIllustrativePricing={true} />);
    const badge = screen.getByTestId("illustrative-pricing-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Illustrative Retail Pricing");
    expect(badge).toHaveAttribute(
      "aria-label",
      "Illustrative Retail Pricing: Actual EA discounts may vary",
    );
  });
});
