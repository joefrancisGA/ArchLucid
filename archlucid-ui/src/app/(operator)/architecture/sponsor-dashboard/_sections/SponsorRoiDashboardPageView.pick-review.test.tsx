import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-summary-markdown";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

const searchParamsState = { value: "" };
const replaceMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      replace: replaceMock,
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(searchParamsState.value),
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", activeRunId: "" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { onChange: (value: string) => void }) => (
    <button type="button" data-testid="ask-run-id-picker" onClick={() => props.onChange("run-picked-1")}>
      pick
    </button>
  ),
}));

function committedSummary(): SponsorRoiSummary {
  return {
    totalEstimatedUsdSavings: 1200,
    systemCount: 1,
    latestRunCount: 1,
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "list",
    systems: [
      {
        systemName: "Claims intake",
        runId: "run-dash-1",
        committedUtc: "2026-01-01T00:00:00.000Z",
        estimatedUsdSavings: 1200,
      },
    ],
    topSystemicIssues: [],
  };
}

vi.mock("@/components/sponsor/SponsorDashboardDataContext", () => ({
  SponsorDashboardDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSponsorDashboardData: () => ({
    summary: committedSummary(),
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
}));

vi.mock("@/components/sponsor/SponsorDashboardPageHero", () => ({
  SponsorDashboardPageHero: () => <header data-testid="sponsor-dashboard-page-hero" />,
}));

vi.mock("./SponsorRoiDashboardNextReviewFooterClient", () => ({
  SponsorRoiDashboardNextReviewFooterClient: () => <div data-testid="sponsor-dashboard-next-review-footer-stub" />,
}));

vi.mock("./SponsorDashboardSupportingMetricsSection", () => ({
  SponsorDashboardSupportingMetricsSection: () => null,
}));

vi.mock("./SponsorExportsSection", () => ({
  SponsorExportsSection: () => null,
}));

vi.mock("./SponsorComplianceDriftTrendSection", () => ({
  SponsorComplianceDriftTrendSection: () => null,
}));

import { SponsorRoiDashboardPageView } from "./SponsorRoiDashboardPageView";

describe("SponsorRoiDashboardPageView URL-scoped pick", () => {
  beforeEach(() => {
    searchParamsState.value = "";
    replaceMock.mockReset();
  });

  it("asks the operator to pick a review before reading KPIs", () => {
    render(<SponsorRoiDashboardPageView />);

    expect(screen.getByTestId("sponsor-dashboard-pick-review-before-kpis-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-dashboard-run-scope-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-dashboard-kpi-setup-progress")).not.toBeInTheDocument();
  });

  it("writes the picked review into the dashboard URL", () => {
    render(<SponsorRoiDashboardPageView />);

    fireEvent.click(screen.getByTestId("ask-run-id-picker"));

    expect(replaceMock).toHaveBeenCalledWith(`${SPONSOR_DASHBOARD_HREF}?runId=run-picked-1`, { scroll: false });
  });

  it("shows the KPI checklist when runId is in the URL", () => {
    searchParamsState.value = "runId=run-dash-1";

    render(<SponsorRoiDashboardPageView />);

    expect(screen.queryByTestId("sponsor-dashboard-pick-review-before-kpis-strip")).not.toBeInTheDocument();
    expect(screen.getByTestId("sponsor-dashboard-run-scope-banner")).toHaveTextContent("run-dash-1");
    expect(screen.getByTestId("sponsor-dashboard-kpi-setup-progress")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-dashboard-next-review-footer-stub")).toBeInTheDocument();
  });
});
