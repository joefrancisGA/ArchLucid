import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { ExecutiveDashboardPageHero } from "@/components/executive/ExecutiveDashboardPageHero";

describe("ExecutiveDashboardPageHero", () => {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  it("renders consolidated hero copy and quiet learn-more link when the dashboard is empty", () => {
    render(<ExecutiveDashboardPageHero dashboardEmpty />);

    expect(screen.getByTestId("executive-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "true");
    expect(screen.getByRole("heading", { name: v.portfolioPageTitle })).toBeInTheDocument();
    expect(screen.getByText(v.portfolioPageLead)).toBeInTheDocument();
    expect(screen.queryByText(v.portfolioPageNextStep)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: v.portfolioPageLearnMoreLabel })).toHaveAttribute(
      "href",
      v.portfolioPageLearnMoreHref,
    );
    expect(screen.queryByRole("link", { name: v.emptyStatePrimaryAction })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: v.emptyStateSecondaryAction })).not.toBeInTheDocument();
  });

  it("keeps the learn-more link when metrics are available", () => {
    render(<ExecutiveDashboardPageHero dashboardEmpty={false} />);

    expect(screen.getByTestId("executive-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "false");
    expect(screen.getByText(v.portfolioPageLead)).toBeInTheDocument();
    expect(screen.queryByText(v.portfolioPageNextStep)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: v.portfolioPageLearnMoreLabel })).toBeInTheDocument();
  });
});
