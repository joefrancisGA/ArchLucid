import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: () => <button type="button">Load sample dashboard</button>,
}));

vi.mock("@/components/executive/ExecutiveDashboardDataContext", () => ({
  ExecutiveDashboardDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useExecutiveDashboardData: () => ({
    summary: { systemCount: 0, latestRunCount: 0, totalEstimatedUsdSavings: 0 },
    summaryLoading: false,
    summaryError: null,
    driftPoints: [],
    driftLoading: false,
    driftError: false,
    refreshing: false,
    lastRefreshedAt: null,
    refreshDashboard: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/app/(operator)/dashboard/_sections/ExecutiveDashboardBaselineWarningBanner", () => ({
  ExecutiveDashboardBaselineWarningBanner: () => null,
  EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF: "/reviews/new?baseline=1",
}));

vi.mock("@/components/ExecutiveValueNarrativeBanner", () => ({
  ExecutiveValueNarrativeBanner: () => null,
}));

vi.mock("@/components/executive/ExecutiveDashboardPageHero", () => ({
  ExecutiveDashboardPageHero: ({ dashboardEmpty }: { dashboardEmpty: boolean }) => (
    <header data-testid="executive-dashboard-page-hero" data-dashboard-empty={dashboardEmpty ? "true" : "false"}>
      <h1 data-testid="executive-summary-heading">Executive dashboard</h1>
      <button type="button" data-testid="executive-dashboard-refresh-button">
        Refresh
      </button>
    </header>
  ),
}));

vi.mock("@/app/(operator)/dashboard/_sections/ExecutiveComplianceDriftTrendSection", () => ({
  ExecutiveComplianceDriftTrendSection: () => <div data-testid="compliance-drift-section" />,
}));

vi.mock("@/app/(operator)/dashboard/_sections/SponsorExportsSection", () => ({
  SponsorExportsSection: ({ surface }: { surface?: string }) => (
    <div data-testid="sponsor-exports-section" data-surface={surface ?? "operator"} />
  ),
}));

vi.mock("@/app/(operator)/dashboard/_sections/ExecutiveDashboardSupportingMetricsSection", () => ({
  ExecutiveDashboardSupportingMetricsSection: () => <div data-testid="supporting-metrics-section" />,
}));

import { ExecutiveRoiDashboardPageView } from "./ExecutiveRoiDashboardPageView";

describe("ExecutiveRoiDashboardPageView executive surface", () => {
  it("shows compact empty path without preview KPI theater or sponsor exports", () => {
    render(<ExecutiveRoiDashboardPageView surface="executive" />);

    expect(screen.getByTestId("executive-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "true");
    expect(screen.queryByTestId("executive-dashboard-preview-metrics")).toBeNull();
    expect(screen.getByTestId("executive-dashboard-how-it-works")).toBeInTheDocument();
    expect(screen.queryByTestId("executive-primary-decisions-needed")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-exports-section")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Executive dashboard" })).toBeInTheDocument();
  });
});

describe("ExecutiveRoiDashboardPageView operator surface (TB-608 consolidation)", () => {
  it("renders the same portfolio empty state and h1 as the executive surface", () => {
    render(<ExecutiveRoiDashboardPageView />);

    expect(screen.getByTestId("executive-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Executive dashboard" })).toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-exports-section")).toBeNull();
  });
});
