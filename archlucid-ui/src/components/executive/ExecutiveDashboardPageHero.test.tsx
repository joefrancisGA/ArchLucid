import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: () => <button type="button">Load sample workspace</button>,
}));

import { ExecutiveDashboardPageHero } from "@/components/executive/ExecutiveDashboardPageHero";

describe("ExecutiveDashboardPageHero", () => {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  it("renders consolidated hero copy and learn-more link when the dashboard is empty", () => {
    render(<ExecutiveDashboardPageHero dashboardEmpty />);

    expect(screen.getByTestId("executive-dashboard-page-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: v.portfolioPageTitle })).toBeInTheDocument();
    expect(screen.getByText(v.portfolioPageLead)).toBeInTheDocument();
    expect(screen.queryByText(v.portfolioPageNextStep)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: v.portfolioPageLearnMoreLabel })).toHaveAttribute(
      "href",
      v.portfolioPageLearnMoreHref,
    );
    expect(screen.getByRole("link", { name: v.emptyStatePrimaryAction })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("button", { name: v.emptyStateSecondaryAction })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View sample portfolio dashboard" })).not.toBeInTheDocument();
  });

  it("hides hero actions when metrics are available", () => {
    render(<ExecutiveDashboardPageHero dashboardEmpty={false} />);

    expect(screen.getByText(v.portfolioPageLead)).toBeInTheDocument();
    expect(screen.queryByText(v.portfolioPageNextStep)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: v.emptyStatePrimaryAction })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: v.portfolioPageLearnMoreLabel })).toBeInTheDocument();
  });
});
