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

vi.mock("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardBaselineWarningBanner", () => ({
  SponsorDashboardBaselineWarningBanner: () => null,
}));

vi.mock("@/components/sponsor/SponsorDashboardPageHero", () => ({
  SponsorDashboardPageHero: () => <header data-testid="sponsor-dashboard-page-hero" />,
}));

import { SponsorRoiDashboardPageView } from "./SponsorRoiDashboardPageView";

describe("SponsorRoiDashboardPageView loading (TB-1532)", () => {
  it("shows structured loading skeleton while sponsor report loads", () => {
    render(<SponsorRoiDashboardPageView surface="sponsor" />);

    expect(screen.getByTestId("sponsor-dashboard-loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-dashboard-empty-state")).not.toBeInTheDocument();
  });
});
