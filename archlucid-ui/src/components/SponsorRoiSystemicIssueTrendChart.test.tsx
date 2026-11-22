import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SponsorRoiSystemicIssueTrendChart } from "@/components/SponsorRoiSystemicIssueTrendChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-responsive">{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown }) => (
    <div data-testid="recharts-bar-chart" data-chart-rows={JSON.stringify(data)}>{children}</div>
  ),
  Bar: ({ dataKey, name }: { dataKey: string; name?: string }) => (
    <span data-testid="recharts-bar" data-series-key={dataKey}>{name ?? dataKey}</span>
  ),
  CartesianGrid: () => null,
  Legend: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe("SponsorRoiSystemicIssueTrendChart", () => {
  it("shows empty state when no series are provided", () => {
    render(<SponsorRoiSystemicIssueTrendChart series={[]} />);

    expect(screen.getByText(/No historical systemic issue trends yet/i)).toBeInTheDocument();
  });

  it("renders recharts container and month labels for monthly counts", () => {
    render(
      <SponsorRoiSystemicIssueTrendChart
        series={[
          {
            category: "Security",
            severity: "Critical",
            findingId: "F-1",
            points: [
              { monthKey: "2026-01", count: 2 },
              { monthKey: "2026-02", count: 1 },
            ],
          },
          {
            category: "Cost",
            severity: "High",
            findingId: "F-2",
            points: [
              { monthKey: "2026-01", count: 1 },
              { monthKey: "2026-02", count: 3 },
            ],
          },
        ]}
        savingsPricingBasis="EA-adjusted"
      />,
    );

    expect(screen.getByTestId("exec-roi-systemic-issue-trend-chart")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-bar-chart")).toBeInTheDocument();
  });

  it("keeps monthly counts distinct for findings with the same category and severity", () => {
    render(
      <SponsorRoiSystemicIssueTrendChart
        series={[
          { category: "Cost", severity: "High", findingId: "F-1", points: [{ monthKey: "2026-01", count: 2 }] },
          { category: "Cost", severity: "High", findingId: "F-2", points: [{ monthKey: "2026-01", count: 5 }] },
        ]}
      />,
    );

    const rows = JSON.parse(screen.getByTestId("recharts-bar-chart").getAttribute("data-chart-rows")!);
    const bars = screen.getAllByTestId("recharts-bar");
    const keys = bars.map((bar) => bar.getAttribute("data-series-key")!);

    expect(keys.map((key) => rows[0][key])).toEqual([2, 5]);
    expect(new Set(keys).size).toBe(2);
    expect(bars.map((bar) => bar.textContent)).toEqual(["Cost · High", "Cost · High"]);
  });
});
