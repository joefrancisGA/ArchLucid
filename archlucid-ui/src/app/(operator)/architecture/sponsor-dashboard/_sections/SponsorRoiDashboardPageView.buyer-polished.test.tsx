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

vi.mock("@/components/sponsor/SponsorDashboardDataContext", () => ({
  SponsorDashboardDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSponsorDashboardData: () => ({
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

vi.mock("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardBaselineWarningBanner", () => ({
  SponsorDashboardBaselineWarningBanner: () => null,
  SPONSOR_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF: "/architecture/reviews/new?baseline=1",
}));

vi.mock("@/components/SponsorValueNarrativeBanner", () => ({
  SponsorValueNarrativeBanner: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorComplianceDriftTrendSection", () => ({
  SponsorComplianceDriftTrendSection: () => <div data-testid="compliance-drift-section" />,
}));

vi.mock("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorExportsSection", () => ({
  SponsorExportsSection: () => null,
}));

vi.mock("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardSupportingMetricsSection", () => ({
  SponsorDashboardSupportingMetricsSection: () => null,
}));

import { SponsorRoiDashboardPageView } from "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiDashboardPageView";
import {
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER,
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  SPONSOR_DASHBOARD_SCOPE_DETAILS_TRIGGER,
} from "@/lib/sponsor-dashboard-page-copy";

describe("SponsorRoiDashboardPageView buyer-polished shell", () => {
  it("uses buyer subtitle and collapses duplicate dashboard intro copy", () => {
    render(<SponsorRoiDashboardPageView surface="sponsor" />);

    expect(screen.getByText(SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(
      within(screen.getByTestId("sponsor-dashboard-page-hero")).queryByText(
        SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-dashboard-scope-details")).toBeNull(); // TB-2093
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-dashboard-refresh-button")).toBeInTheDocument();
    expect(screen.queryByText(SPONSOR_DASHBOARD_SCOPE_DETAILS_TRIGGER)).toBeNull(); // TB-2093
    expect(screen.queryByTestId("sponsor-dashboard-how-it-works")).not.toBeInTheDocument();
  });
});
