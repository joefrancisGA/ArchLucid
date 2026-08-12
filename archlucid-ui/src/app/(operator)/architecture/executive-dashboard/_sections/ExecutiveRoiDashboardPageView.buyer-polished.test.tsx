import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
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

vi.mock("@/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveDashboardBaselineWarningBanner", () => ({
  ExecutiveDashboardBaselineWarningBanner: () => null,
  EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF: "/architecture/reviews/new?baseline=1",
}));

vi.mock("@/components/ExecutiveValueNarrativeBanner", () => ({
  ExecutiveValueNarrativeBanner: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveComplianceDriftTrendSection", () => ({
  ExecutiveComplianceDriftTrendSection: () => <div data-testid="compliance-drift-section" />,
}));

vi.mock("@/app/(operator)/architecture/executive-dashboard/_sections/SponsorExportsSection", () => ({
  SponsorExportsSection: () => null,
}));

vi.mock("@/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveDashboardSupportingMetricsSection", () => ({
  ExecutiveDashboardSupportingMetricsSection: () => null,
}));

import { ExecutiveRoiDashboardPageView } from "@/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveRoiDashboardPageView";
import {
  EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER,
  EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  EXECUTIVE_DASHBOARD_SCOPE_DETAILS_TRIGGER,
} from "@/lib/executive-dashboard-page-copy";

describe("ExecutiveRoiDashboardPageView buyer-polished shell", () => {
  it("uses buyer subtitle and collapses duplicate dashboard intro copy", () => {
    render(<ExecutiveRoiDashboardPageView surface="executive" />);

    expect(screen.getByText(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(
      within(screen.getByTestId("executive-dashboard-page-hero")).queryByText(
        EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("executive-dashboard-scope-details")).toBeNull(); // TB-2093
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-refresh-button")).toBeInTheDocument();
    expect(screen.queryByText(EXECUTIVE_DASHBOARD_SCOPE_DETAILS_TRIGGER)).toBeNull(); // TB-2093
    expect(screen.queryByTestId("executive-dashboard-how-it-works")).not.toBeInTheDocument();
  });
});
