import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorRoiIdentifiedVsRealizedPanel } from "./SponsorRoiIdentifiedVsRealizedPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { resolveSponsorRoiIdentifiedVsRealized } from "@/lib/sponsor-roi-identified-vs-realized";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { ROI_HEADLINE_MATH_TOOLTIP_LABEL } from "@/lib/roi-disposition-training-copy";
import {
  SPONSOR_ROI_IDENTIFIED_PENDING_LABEL,
  SPONSOR_ROI_REALIZED_COMMITTED_LABEL,
} from "@/lib/sponsor/sponsor-roi-identified-vs-realized";

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
  it("links to decisions-remediation when realized savings were not stored", () => {
    const noBasisSummary: SponsorRoiSummary = {
      ...summary,
      basisBreakdown: undefined,
      systems: [{ systemName: "Payments", runId: "run-pick-1", committedUtc: null, estimatedUsdSavings: 10_000 }],
    };

    render(
      <TooltipProvider>
        <SponsorRoiIdentifiedVsRealizedPanel
          summary={noBasisSummary}
          buckets={resolveSponsorRoiIdentifiedVsRealized(noBasisSummary)}
          dispositionReviewHref="/architecture/architectures/arch-1/reviews/run-pick-1?reviewTab=decisions-remediation"
        />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("exec-roi-realized-not-stored-open-review")).toHaveAttribute(
      "href",
      "/architecture/architectures/arch-1/reviews/run-pick-1?reviewTab=decisions-remediation",
    );
  });

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
    expect(screen.getByText(SPONSOR_ROI_IDENTIFIED_PENDING_LABEL)).toBeInTheDocument();
    expect(screen.getByText(SPONSOR_ROI_REALIZED_COMMITTED_LABEL)).toBeInTheDocument();
    expect(screen.getByTestId("exec-roi-identified-pending-usd")).toHaveTextContent("$120,000");
    expect(screen.getByTestId("exec-roi-realized-usd")).toHaveTextContent("$25,000");
  });
});
