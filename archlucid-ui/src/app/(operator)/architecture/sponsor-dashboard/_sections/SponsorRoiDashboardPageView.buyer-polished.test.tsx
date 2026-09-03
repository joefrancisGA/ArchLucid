import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      replace: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
  };
});

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
    summary: { systemCount: 0, latestRunCount: 0, totalEstimatedUsdSavings: 0, systems: [] },
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
  ARCHITECTURE_SPONSOR_DASHBOARD_CLAIM_DISCIPLINE,
  ARCHITECTURE_SPONSOR_DASHBOARD_FOLLOW_UPS_TITLE,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import {
  SPONSOR_DASHBOARD_FIRST_VIEWPORT_ID,
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER,
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  SPONSOR_DASHBOARD_SCOPE_DETAILS_TRIGGER,
  SPONSOR_DASHBOARD_SKIP_LINK_LABEL,
  SPONSOR_DASHBOARD_SKIP_TARGET_ID,
} from "@/lib/sponsor/sponsor-dashboard-page-copy";

describe("SponsorRoiDashboardPageView buyer-polished shell (ARE)", () => {
  it("renders skip link, workspace before follow-ups, buyer subtitle, and keeps contextual help", () => {
    render(<SponsorRoiDashboardPageView surface="sponsor" />);

    expect(screen.getByRole("link", { name: SPONSOR_DASHBOARD_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SPONSOR_DASHBOARD_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();

    if (SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR !== SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER) {
      expect(
        within(screen.getByTestId("sponsor-dashboard-page-hero")).queryByText(
          SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
        ),
      ).not.toBeInTheDocument();
    }
    expect(screen.queryByTestId("sponsor-dashboard-scope-details")).toBeNull(); // TB-2093
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-dashboard-refresh-button")).toBeInTheDocument();
    expect(screen.queryByText(SPONSOR_DASHBOARD_SCOPE_DETAILS_TRIGGER)).toBeNull(); // TB-2093
    expect(screen.queryByTestId("sponsor-dashboard-how-it-works")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-sponsor-dashboard-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_SPONSOR_DASHBOARD_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_SPONSOR_DASHBOARD_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-sponsor-dashboard-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("sponsor-dashboard-primary-content");
    const hero = screen.getByTestId("sponsor-dashboard-page-hero");
    const firstViewport = screen.getByTestId(SPONSOR_DASHBOARD_FIRST_VIEWPORT_ID);
    const emptyState = screen.getByTestId("sponsor-dashboard-empty-state");
    const orientationBottom = screen.getByTestId("architecture-sponsor-dashboard-orientation-bottom");

    expect(primaryContent).toContainElement(hero);
    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(emptyState);
    expect(hero.compareDocumentPosition(firstViewport) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
