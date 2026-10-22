import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AiUsageKpiSummary } from "@/lib/ai-usage-dashboard-model";

import { AiUsageKpiRow } from "./AiUsageKpiRow";

function buildKpi(overrides: Partial<AiUsageKpiSummary> = {}): AiUsageKpiSummary {
  return {
    usedThisMonthUsd: 0,
    remainingBudgetUsd: 75,
    budgetTotalUsd: 75,
    budgetPercentUsed: 0,
    projectedMonthEndUsd: 0,
    projectedIsApproximate: true,
    daysRemainingInBillingPeriod: 10,
    changeVsPrior30DaysPercent: null,
    changeVsPrior30DaysIsApproximate: true,
    highestCostProjectName: null,
    highestCostOperationName: null,
    currency: "USD",
    ...overrides,
  };
}

describe("AiUsageKpiRow (TB-1220)", () => {
  it("does not render Highest-cost project when the model omits it", () => {
    render(<AiUsageKpiRow kpi={buildKpi()} loading={false} />);

    expect(screen.queryByTestId("ai-usage-kpi-top-project")).not.toBeInTheDocument();
    expect(screen.queryByText("Highest-cost project")).not.toBeInTheDocument();
    expect(screen.queryByText("Current project")).not.toBeInTheDocument();
  });

  it("renders Highest-cost project when attributed usage supplies a name", () => {
    render(
      <AiUsageKpiRow
        kpi={buildKpi({
          usedThisMonthUsd: 12,
          highestCostProjectName: "Claims modernization",
        })}
        loading={false}
      />,
    );

    expect(screen.getByTestId("ai-usage-kpi-top-project")).toHaveTextContent("Claims modernization");
  });
});
