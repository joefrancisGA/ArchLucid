import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorRoiIdentifiedVsRealizedPanel } from "./SponsorRoiIdentifiedVsRealizedPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { resolveSponsorRoiIdentifiedVsRealized } from "@/lib/sponsor-roi-identified-vs-realized";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { ROI_HEADLINE_MATH_TOOLTIP_LABEL } from "@/lib/roi-disposition-training-copy";

const summary: SponsorRoiSummary = {
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

describe("SponsorRoiIdentifiedVsRealizedPanel", () => {
  it("renders separate identified pending and realized committed amounts", () => {
    render(
      <TooltipProvider>
        <SponsorRoiIdentifiedVsRealizedPanel
          summary={summary}
          buckets={resolveSponsorRoiIdentifiedVsRealized(summary)}
        />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("exec-roi-identified-vs-realized-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Sponsor ROI" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: `Help: ${ROI_HEADLINE_MATH_TOOLTIP_LABEL}` }),
    ).toHaveLength(2);
    expect(screen.getByText("Identified savings (pending approval)")).toBeInTheDocument();
    expect(screen.getByText("Realized savings (committed & applied)")).toBeInTheDocument();
    expect(screen.getByTestId("exec-roi-identified-pending-usd")).toHaveTextContent("$120,000");
    expect(screen.getByTestId("exec-roi-realized-usd")).toHaveTextContent("$25,000");
  });
});
