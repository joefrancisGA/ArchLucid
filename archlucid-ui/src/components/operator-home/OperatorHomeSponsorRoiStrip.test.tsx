import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { OperatorHomeSponsorRoiStrip } from "@/components/operator-home/OperatorHomeSponsorRoiStrip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 3,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/fetch-sponsor-roi-summary-client", () => ({
  fetchSponsorRoiSummaryClient: vi.fn(),
}));

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { fetchSponsorRoiSummaryClient } from "@/lib/fetch-sponsor-roi-summary-client";

describe("OperatorHomeSponsorRoiStrip", () => {
  it("renders nothing before the tenant has a committed architecture review", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    const { container } = renderWithOperatorQuery(<OperatorHomeSponsorRoiStrip />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows compact savings after commit when sponsor report loads", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchSponsorRoiSummaryClient).mockResolvedValue({
      totalEstimatedUsdSavings: 125000,
      systemCount: 2,
      latestRunCount: 2,
      eaDiscountMultiplier: 1,
      savingsPricingBasis: "Retail",
      systems: [],
      topSystemicIssues: [],
      headlineSavingsScopeCode: "disposition-aware-headline",
      headlineSavingsScopeDescription: "Disposition-aware portfolio headline",
    });

    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorHomeSponsorRoiStrip />
      </TooltipProvider>,
    );

    expect(await screen.findByTestId("operator-home-roi-strip")).toBeInTheDocument();
    expect(screen.getByText(/125,000/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Sponsor ROI" })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-roi-strip-open-scorecard")).toHaveAttribute("href", "/insights/architecture-scorecard");
  });

  it("hides zero or missing savings chrome (TB-1037)", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchSponsorRoiSummaryClient).mockResolvedValue({
      totalEstimatedUsdSavings: 0,
      systemCount: 0,
      latestRunCount: 1,
      eaDiscountMultiplier: 1,
      savingsPricingBasis: "Missing",
      systems: [],
      topSystemicIssues: [],
      headlineSavingsScopeCode: "disposition-aware-headline",
      headlineSavingsScopeDescription: "Disposition-aware portfolio headline",
    });

    const { container } = renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorHomeSponsorRoiStrip />
      </TooltipProvider>,
    );

    await waitFor(() => {
      expect(fetchSponsorRoiSummaryClient).toHaveBeenCalled();
      expect(container.querySelector('[data-testid="operator-home-roi-strip"]')).toBeNull();
      expect(container.querySelector('[data-testid="operator-home-roi-strip-loading"]')).toBeNull();
    });
  });
});