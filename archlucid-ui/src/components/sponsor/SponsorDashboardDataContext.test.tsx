import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-sponsor-dashboard-bundle-query", () => ({
  useSponsorDashboardBundleQuery: () => ({
    data: {
      sponsorReport: { systemCount: 1, totalEstimatedUsdSavings: 1000 },
      complianceDriftTrend: [],
    },
    isPending: false,
    isFetched: true,
    isError: false,
    isFetching: false,
  }),
}));

import {
  SponsorDashboardDataProvider,
  useSponsorDashboardData,
} from "./SponsorDashboardDataContext";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

function Consumer(): React.JSX.Element {
  const { summaryLoading, summary } = useSponsorDashboardData();

  return (
    <div data-testid="consumer">
      {summaryLoading ? "loading" : `systems:${summary?.systemCount ?? 0}`}
    </div>
  );
}

describe("SponsorDashboardDataContext", () => {
  it("exposes fetched data to a consuming child", async () => {
    renderWithOperatorQuery(
      <SponsorDashboardDataProvider>
        <Consumer />
      </SponsorDashboardDataProvider>,
    );

    expect(await screen.findByText("systems:1")).toBeInTheDocument();
  });

  it("throws when useSponsorDashboardData is called outside the provider", () => {
    expect(() => render(<Consumer />)).toThrow(
      "useSponsorDashboardData must be used within SponsorDashboardDataProvider",
    );
  });
});
