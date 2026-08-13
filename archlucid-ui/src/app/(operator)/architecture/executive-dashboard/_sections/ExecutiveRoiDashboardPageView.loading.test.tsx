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
    summary: null,
    summaryLoading: true,
    summaryError: null,
    driftPoints: [],
    driftLoading: false,
    driftError: false,
    refreshing: false,
    lastRefreshedAt: null,
    refreshDashboard: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveDashboardBaselineWarningBanner", () => ({
  ExecutiveDashboardBaselineWarningBanner: () => null,
}));

vi.mock("@/components/executive/ExecutiveDashboardPageHero", () => ({
  ExecutiveDashboardPageHero: () => <header data-testid="executive-dashboard-page-hero" />,
}));

import { ExecutiveRoiDashboardPageView } from "./ExecutiveRoiDashboardPageView";

describe("ExecutiveRoiDashboardPageView loading (TB-1532)", () => {
  it("shows structured loading skeleton while executive summary loads", () => {
    render(<ExecutiveRoiDashboardPageView surface="executive" />);

    expect(screen.getByTestId("executive-dashboard-loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("executive-dashboard-empty-state")).not.toBeInTheDocument();
  });
});
