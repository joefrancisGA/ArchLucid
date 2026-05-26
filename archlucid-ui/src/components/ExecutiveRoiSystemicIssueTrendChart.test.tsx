import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveRoiSystemicIssueTrendChart } from "@/components/ExecutiveRoiSystemicIssueTrendChart";

describe("ExecutiveRoiSystemicIssueTrendChart", () => {
  it("shows empty state when no series are provided", () => {
    render(<ExecutiveRoiSystemicIssueTrendChart series={[]} />);

    expect(screen.getByText(/No historical systemic issue trends yet/i)).toBeInTheDocument();
  });

  it("renders stacked bars and legend for monthly counts", () => {
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
      />,
    );

    expect(screen.getByTestId("exec-roi-systemic-issue-trend-chart")).toBeInTheDocument();
    expect(screen.getByText("Security · Critical")).toBeInTheDocument();
    expect(screen.getByText("Cost · High")).toBeInTheDocument();
    expect(screen.getByText("01/26")).toBeInTheDocument();
    expect(screen.getByText("02/26")).toBeInTheDocument();
  });
});
