import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveRoiIdentifiedVsRealizedPanel } from "./ExecutiveRoiIdentifiedVsRealizedPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { resolveExecutiveRoiIdentifiedVsRealized } from "@/lib/executive-roi-identified-vs-realized";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { ROI_HEADLINE_MATH_TOOLTIP_LABEL } from "@/lib/roi-disposition-training-copy";

const summary: ExecutiveRoiSummary = {
  totalEstimatedUsdSavings: 120_000,
  systemCount: 1,
  latestRunCount: 1,
  eaDiscountMultiplier: 1,
  savingsPricingBasis: "Retail",
  systems: [],
  topSystemicIssues: [],
  basisBreakdown: {
    openEstimatedUsd: 80_000,
    acceptedRiskUsd: 0,
    needsEvidenceUsd: 40_000,
    deferredUsd: 0,
    waivedUsd: 0,
    realizedUsd: 25_000,
    rejectedNotApplicableUsd: 0,
    totalPotentialUsd: 120_000,
  },
};

describe("ExecutiveRoiIdentifiedVsRealizedPanel", () => {
  it("renders separate identified pending and realized committed amounts", () => {
    render(
      <TooltipProvider>
        <ExecutiveRoiIdentifiedVsRealizedPanel
          summary={summary}
          buckets={resolveExecutiveRoiIdentifiedVsRealized(summary)}
        />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("exec-roi-identified-vs-realized-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Executive ROI" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: `Help: ${ROI_HEADLINE_MATH_TOOLTIP_LABEL}` }),
    ).toHaveLength(2);
    expect(screen.getByText("Identified savings (pending approval)")).toBeInTheDocument();
    expect(screen.getByText("Realized savings (committed & applied)")).toBeInTheDocument();
    expect(screen.getByTestId("exec-roi-identified-pending-usd")).toHaveTextContent("$120,000");
    expect(screen.getByTestId("exec-roi-realized-usd")).toHaveTextContent("$25,000");
  });
});
