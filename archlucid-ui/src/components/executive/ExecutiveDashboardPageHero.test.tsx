import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER,
  executiveDashboardPageSubtitle,
} from "@/lib/executive-dashboard-page-copy";

const refreshDashboard = vi.fn(async () => undefined);

vi.mock("next/navigation", () => ({
  usePathname: () => EXECUTIVE_DASHBOARD_HREF,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("@/components/executive/ExecutiveDashboardDataContext", () => ({
  useExecutiveDashboardData: () => ({
    refreshing: false,
    lastRefreshedAt: new Date("2026-07-09T12:00:00.000Z"),
    refreshDashboard,
  }),
}));

import { ExecutiveDashboardPageHero } from "@/components/executive/ExecutiveDashboardPageHero";

describe("ExecutiveDashboardPageHero", () => {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  it("renders h1, help, refresh, and header Start only when the dashboard is empty", () => {
    render(<ExecutiveDashboardPageHero dashboardEmpty />);

    expect(screen.getByTestId("executive-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "true");
    expect(screen.getByRole("heading", { level: 2, name: v.portfolioPageTitle })).toBeInTheDocument();
    expect(screen.getByText(executiveDashboardPageSubtitle())).toBeInTheDocument();
    expect(screen.getByText(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(v.portfolioPageNextStep)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
    expect(screen.getByTestId("executive-dashboard-hero-start-review")).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByTestId("executive-dashboard-hero-start-review")).toHaveTextContent(v.emptyStatePrimaryAction);
    expect(screen.queryByRole("link", { name: v.portfolioPageLearnMoreLabel })).toBeNull();
    expect(screen.queryByRole("button", { name: v.emptyStateSecondaryAction })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("executive-dashboard-refresh-button"));

    expect(refreshDashboard).toHaveBeenCalledTimes(1);
  });

  it("omits header Start when metrics are available but keeps help, refresh, and learn-more", () => {
    render(<ExecutiveDashboardPageHero dashboardEmpty={false} />);

    expect(screen.getByTestId("executive-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "false");
    expect(screen.getByText(executiveDashboardPageSubtitle())).toBeInTheDocument();
    expect(screen.queryByText(v.portfolioPageNextStep)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("executive-dashboard-hero-start-review")).toBeNull();
    expect(screen.getByRole("link", { name: v.portfolioPageLearnMoreLabel })).toBeInTheDocument();
  });
});
