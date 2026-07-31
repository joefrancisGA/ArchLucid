import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

import { ExecutiveDashboardPageHero } from "@/components/executive/ExecutiveDashboardPageHero";

describe("ExecutiveDashboardPageHero", () => {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  it("renders h1, help, header Start, and quiet learn-more when the dashboard is empty", () => {
    render(<ExecutiveDashboardPageHero dashboardEmpty />);

    expect(screen.getByTestId("executive-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "true");
    expect(screen.getByRole("heading", { level: 1, name: v.portfolioPageTitle })).toBeInTheDocument();
    expect(screen.getByText(v.portfolioPageLead)).toBeInTheDocument();
    expect(screen.queryByText(v.portfolioPageNextStep)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-hero-start-review")).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByTestId("executive-dashboard-hero-start-review")).toHaveTextContent(v.emptyStatePrimaryAction);
    expect(screen.getByRole("link", { name: v.portfolioPageLearnMoreLabel })).toHaveAttribute(
      "href",
      v.portfolioPageLearnMoreHref,
    );
    expect(screen.queryByRole("button", { name: v.emptyStateSecondaryAction })).not.toBeInTheDocument();
  });

  it("omits header Start when metrics are available but keeps help and learn-more", () => {
    render(<ExecutiveDashboardPageHero dashboardEmpty={false} />);

    expect(screen.getByTestId("executive-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "false");
    expect(screen.getByText(v.portfolioPageLead)).toBeInTheDocument();
    expect(screen.queryByText(v.portfolioPageNextStep)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("executive-dashboard-hero-start-review")).toBeNull();
    expect(screen.getByRole("link", { name: v.portfolioPageLearnMoreLabel })).toBeInTheDocument();
  });
});
