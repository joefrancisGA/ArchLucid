import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExecutiveRoiSystemicIssueTrendChart } from "@/components/ExecutiveRoiSystemicIssueTrendChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-responsive">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="recharts-bar-chart">{children}</div>,
  Bar: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe("ExecutiveRoiSystemicIssueTrendChart", () => {
  it("shows empty state when no series are provided", () => {
    render(<ExecutiveRoiSystemicIssueTrendChart series={[]} />);

    expect(screen.getByText(/No historical systemic issue trends yet/i)).toBeInTheDocument();
  });

  it("renders recharts container and month labels for monthly counts", () => {
    render(
      <ExecutiveRoiSystemicIssueTrendChart
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
});
