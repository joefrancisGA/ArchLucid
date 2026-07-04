import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveRoiSystemsIncludedSection } from "./ExecutiveRoiSystemsIncludedSection";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import {
  ROI_SYSTEM_ROW_MATH_TOOLTIP_LABEL,
} from "@/lib/roi-disposition-training-copy";

const summary: ExecutiveRoiSummary = {
  totalEstimatedUsdSavings: 50_000,
  systemCount: 2,
  latestRunCount: 2,
  eaDiscountMultiplier: 1,
  savingsPricingBasis: "Retail",
  costEvidenceFreshnessStatus: "Fresh",
  systems: [
    {
      systemName: "Billing API",
      runId: "run-billing-001",
      committedUtc: "2026-06-01T00:00:00Z",
      estimatedUsdSavings: 30_000,
    },
    {
      systemName: "Portal",
      runId: "run-portal-002",
      committedUtc: "2026-06-02T00:00:00Z",
      estimatedUsdSavings: 25_000,
    },
  ],
  topSystemicIssues: [],
};

describe("ExecutiveRoiSystemsIncludedSection", () => {
  it("renders per-system rows with savings math help tooltips", () => {
    render(
      <TooltipProvider>
        <ExecutiveRoiSystemsIncludedSection summary={summary} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("exec-roi-systems-included-section")).toBeInTheDocument();
    expect(screen.getByText("Billing API")).toBeInTheDocument();
    expect(screen.getByText("Portal")).toBeInTheDocument();
    expect(screen.getByTestId("exec-roi-system-savings-run-billing-001")).toHaveTextContent("$30,000");
    expect(screen.getByTestId("exec-roi-system-savings-run-portal-002")).toHaveTextContent("$25,000");
    expect(
      screen.getAllByRole("button", { name: `Help: ${ROI_SYSTEM_ROW_MATH_TOOLTIP_LABEL}` }),
    ).toHaveLength(2);
  });

  it("returns null when no systems are included", () => {
    const { container } = render(
      <ExecutiveRoiSystemsIncludedSection
        summary={{
          ...summary,
          systems: [],
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
