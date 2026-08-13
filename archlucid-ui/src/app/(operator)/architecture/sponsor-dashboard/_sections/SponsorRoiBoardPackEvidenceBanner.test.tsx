import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorRoiBoardPackEvidenceBanner } from "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiBoardPackEvidenceBanner";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";

function baseSummary(overrides: Partial<SponsorRoiSummary> = {}): SponsorRoiSummary {
  return {
    totalEstimatedUsdSavings: 50000,
    systemCount: 1,
    latestRunCount: 1,
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "Retail",
    systems: [],
    topSystemicIssues: [{ category: "Security architecture", severity: "Critical", count: 2 }],
    ...overrides,
  };
}

describe("SponsorRoiBoardPackEvidenceBanner", () => {
  it("renders cluster rows with illustrative and review-backed posture tags", () => {
    render(
      <SponsorRoiBoardPackEvidenceBanner
        summary={baseSummary({
          savingsPricingBasis: "Illustrative demo",
          topSystemicIssues: [
            { category: "Cost optimization", severity: "Warning", count: 1 },
            { category: "Security architecture", severity: "Critical", count: 2 },
          ],
        })}
        includeNarrative={false}
      />,
    );

    expect(screen.getByTestId("exec-roi-board-pack-evidence-banner")).toBeInTheDocument();
    expect(screen.getAllByTestId("exec-roi-board-pack-evidence-cluster")).toHaveLength(2);
    expect(screen.getByTestId("exec-roi-board-pack-posture-illustrative")).toHaveTextContent("Illustrative");
    expect(screen.getByTestId("exec-roi-board-pack-posture-review-backed")).toHaveTextContent("Review-backed");
  });

  it("notes advisory narrative when board pack narrative toggle is enabled", () => {
    render(<SponsorRoiBoardPackEvidenceBanner summary={baseSummary()} includeNarrative={true} />);

    expect(screen.getByText(/optional AI narrative is advisory/i)).toBeInTheDocument();
  });
});
