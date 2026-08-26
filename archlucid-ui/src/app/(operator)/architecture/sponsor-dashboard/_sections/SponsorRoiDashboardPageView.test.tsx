import { render, screen } from "@testing-library/react";
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
    isBuyerPolishedOperatorShellEnv: () => false,
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

vi.mock("@/components/sponsor/SponsorDashboardPageHero", () => ({
  SponsorDashboardPageHero: ({ dashboardEmpty }: { dashboardEmpty: boolean }) => (
    <header data-testid="sponsor-dashboard-page-hero" data-dashboard-empty={dashboardEmpty ? "true" : "false"}>
      <h2 data-testid="sponsor-report-heading">Sponsor dashboard</h2>
      <button type="button" data-testid="sponsor-dashboard-refresh-button">
        Refresh
      </button>
    </header>
  ),
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", activeRunId: "" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorComplianceDriftTrendSection", () => ({
  SponsorComplianceDriftTrendSection: () => <div data-testid="compliance-drift-section" />,
}));

vi.mock("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorExportsSection", () => ({
  SponsorExportsSection: ({ surface }: { surface?: string }) => (
    <div data-testid="sponsor-exports-section" data-surface={surface ?? "operator"} />
  ),
}));

vi.mock("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardSupportingMetricsSection", () => ({
  SponsorDashboardSupportingMetricsSection: () => <div data-testid="supporting-metrics-section" />,
}));

import { SponsorRoiDashboardPageView } from "./SponsorRoiDashboardPageView";

describe("SponsorRoiDashboardPageView sponsor surface", () => {
  it("shows compact empty path without preview KPI theater or sponsor exports", () => {
    render(<SponsorRoiDashboardPageView surface="sponsor" />);

    expect(screen.getByTestId("sponsor-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-dashboard-page-hero")).toHaveAttribute("data-dashboard-empty", "true");
    expect(screen.queryByTestId("sponsor-dashboard-preview-metrics")).toBeNull();
    // How-it-works + workspace-health load via next/dynamic; sync tests see deferred loading shells.
    expect(screen.getAllByTestId("sponsor-dashboard-deferred-chunk-loading").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("sponsor-primary-decisions-needed")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-exports-section")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Sponsor dashboard" })).toBeInTheDocument();
  });
});

describe("SponsorRoiDashboardPageView operator surface (TB-608 consolidation)", () => {
  it("renders the same portfolio empty state and h2 as the sponsor surface", () => {
    render(<SponsorRoiDashboardPageView />);

    expect(screen.getByTestId("sponsor-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Sponsor dashboard" })).toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-exports-section")).toBeNull();
  });
});
