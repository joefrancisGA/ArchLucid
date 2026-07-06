import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: () => <button type="button">Load sample workspace</button>,
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
      <h2 data-testid="executive-summary-heading">Executive dashboard</h2>
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
  it("shows global empty state instead of KPI wall when no committed reviews", () => {
    render(<ExecutiveRoiDashboardPageView surface="executive" />);

    expect(screen.getByTestId("executive-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "true");
    expect(screen.queryByTestId("executive-dashboard-empty-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("executive-primary-decisions-needed")).not.toBeInTheDocument();
    expect(screen.getByTestId("sponsor-exports-section")).toHaveAttribute("data-surface", "executive");
    expect(screen.getByRole("heading", { name: "Executive dashboard" })).toBeInTheDocument();
  });
});

describe("ExecutiveRoiDashboardPageView operator surface (TB-608 consolidation)", () => {
  it("renders the same portfolio empty state and heading as the executive surface", () => {
    render(<ExecutiveRoiDashboardPageView />);

    expect(screen.getByTestId("executive-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Executive dashboard" })).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-exports-section")).toHaveAttribute("data-surface", "operator");
  });
});
