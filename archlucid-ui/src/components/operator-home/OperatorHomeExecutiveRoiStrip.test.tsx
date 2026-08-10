import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { OperatorHomeExecutiveRoiStrip } from "@/components/operator-home/OperatorHomeExecutiveRoiStrip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
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

vi.mock("@/lib/fetch-executive-roi-summary-client", () => ({
  fetchExecutiveRoiSummaryClient: vi.fn(),
}));

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";

describe("OperatorHomeExecutiveRoiStrip", () => {
  it("renders nothing before the tenant has a committed architecture review", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    const { container } = renderWithOperatorQuery(<OperatorHomeExecutiveRoiStrip />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows compact savings after commit when executive summary loads", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchExecutiveRoiSummaryClient).mockResolvedValue({
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
        <OperatorHomeExecutiveRoiStrip />
      </TooltipProvider>,
    );

    expect(await screen.findByTestId("operator-home-roi-strip")).toBeInTheDocument();
    expect(screen.getByText(/125,000/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Executive ROI" })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-roi-strip-open-scorecard")).toHaveAttribute("href", "/insights/architecture-scorecard");
  });

  it("hides zero or missing savings chrome (TB-1037)", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchExecutiveRoiSummaryClient).mockResolvedValue({
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
        <OperatorHomeExecutiveRoiStrip />
      </TooltipProvider>,
    );

    await waitFor(() => {
      expect(fetchExecutiveRoiSummaryClient).toHaveBeenCalled();
      expect(container.querySelector('[data-testid="operator-home-roi-strip"]')).toBeNull();
      expect(container.querySelector('[data-testid="operator-home-roi-strip-loading"]')).toBeNull();
    });
  });
});