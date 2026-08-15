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
});
