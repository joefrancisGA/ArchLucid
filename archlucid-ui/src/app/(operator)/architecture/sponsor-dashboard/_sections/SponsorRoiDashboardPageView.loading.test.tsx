import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const bundleFetchStatus = vi.hoisted(() => ({ value: "fetching" as "fetching" | "paused" }));
const evalChromeFixtureOn = vi.hoisted(() => ({ enabled: true }));

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

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => false,
  useProductionEvalChrome: () => evalChromeFixtureOn.enabled,
}));

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: () => <button type="button">Load sample dashboard</button>,
}));

vi.mock("@/hooks/use-sponsor-dashboard-bundle-query", () => ({
  useSponsorDashboardBundleQuery: () => ({
    data: undefined,
    isPending: true,
    isFetched: false,
    isError: false,
    isFetching: bundleFetchStatus.value === "fetching",
    fetchStatus: bundleFetchStatus.value,
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
    bundleFetchStatus.value = "fetching";
    renderWithOperatorQuery(<SponsorRoiDashboardPageView surface="sponsor" />);

    expect(screen.getByTestId("sponsor-dashboard-loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-dashboard-empty-state")).not.toBeInTheDocument();
  });

  it("reports a paused first fetch without presenting an empty workspace", () => {
    bundleFetchStatus.value = "paused";
    renderWithOperatorQuery(<SponsorRoiDashboardPageView surface="sponsor" />);

    expect(screen.getByText("Waiting for a network connection to load portfolio ROI…")).toHaveAttribute("role", "status");
    expect(screen.queryByTestId("sponsor-dashboard-loading-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-dashboard-empty-state")).not.toBeInTheDocument();
  });
});
