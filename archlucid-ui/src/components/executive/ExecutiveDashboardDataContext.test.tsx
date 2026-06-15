import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch-executive-roi-summary-client", () => ({
  fetchExecutiveRoiSummaryClient: vi.fn().mockResolvedValue({
    systemCount: 1,
    totalEstimatedUsdSavings: 1000,
  }),
}));

vi.mock("@/lib/api", () => ({
  getComplianceDriftTrend: vi.fn().mockResolvedValue([]),
}));

import {
  ExecutiveDashboardDataProvider,
  useExecutiveDashboardData,
} from "./ExecutiveDashboardDataContext";

function Consumer(): React.JSX.Element {
  const { summaryLoading, summary } = useExecutiveDashboardData();

  return (
    <div data-testid="consumer">
      {summaryLoading ? "loading" : `systems:${summary?.systemCount ?? 0}`}
    </div>
  );
}

describe("ExecutiveDashboardDataContext", () => {
  it("exposes fetched data to a consuming child", async () => {
    render(
      <ExecutiveDashboardDataProvider>
        <Consumer />
      </ExecutiveDashboardDataProvider>,
    );

    expect(await screen.findByText("systems:1")).toBeInTheDocument();
  });

  it("throws when useExecutiveDashboardData is called outside the provider", () => {
    expect(() => render(<Consumer />)).toThrow(
      "useExecutiveDashboardData must be used within ExecutiveDashboardDataProvider",
    );
  });
});
