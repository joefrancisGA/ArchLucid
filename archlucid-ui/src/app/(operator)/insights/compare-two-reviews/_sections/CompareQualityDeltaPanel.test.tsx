import { describe, expect, it } from "vitest";

import { CompareQualityDeltaPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaPanel";
import { render, screen } from "@testing-library/react";

describe("CompareQualityDeltaPanel", () => {
  it("renders stratified delta rows", () => {
    render(
      <CompareQualityDeltaPanel
        counts={{
          unsupportedAssumptionsBefore: 9,
          unsupportedAssumptionsAfter: 2,
          highSeverityBefore: 7,
          highSeverityAfter: 1,
          uncoveredMandatoryBefore: 8,
          uncoveredMandatoryAfter: 2,
          evidenceBackedDecisionsBefore: 48,
          evidenceBackedDecisionsAfter: 86,
        }}
      />,
    );

    expect(screen.getByTestId("compare-quality-delta-panel")).toBeTruthy();
    expect(screen.getByText("Unsupported assumptions")).toBeTruthy();
    expect(screen.getByText("9 → 2")).toBeTruthy();
  });

  it("renders new-finding trust lane breakdown when provided", () => {
    render(
      <CompareQualityDeltaPanel
        counts={{
          unsupportedAssumptionsBefore: 1,
          unsupportedAssumptionsAfter: 0,
          highSeverityBefore: 1,
          highSeverityAfter: 0,
          uncoveredMandatoryBefore: 0,
          uncoveredMandatoryAfter: 0,
          evidenceBackedDecisionsBefore: 0,
          evidenceBackedDecisionsAfter: 1,
        }}
        newFindingTrustLanes={[{ label: "Policy / compliance engine", count: 2 }]}
      />,
    );

    expect(screen.getByTestId("compare-quality-delta-trust-lanes")).toBeTruthy();
    expect(screen.getByText("Policy / compliance engine")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });
});
