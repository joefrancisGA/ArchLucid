import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LlmBudgetUtilizationMeter } from "@/components/llm/LlmBudgetUtilizationMeter";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const fetchStatus = vi.hoisted(() => vi.fn());

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatus: fetchStatus,
  };
});

describe("LlmBudgetUtilizationMeter", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    fetchStatus.mockReset();
  });

  it("renders inactive copy when monitoring is off", async () => {
    fetchStatus.mockResolvedValue({
      monthlyBudgetMonitoringActive: false,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: null,
      effectiveHardCapUsd: null,
      purchasedCapBumpUsd: null,
      estimatedUsdPressure: null,
      assumedNextCallReservationUsd: null,
      hardCapUtilizationFraction: null,
      warnFraction: null,
    });

    renderWithOperatorQuery(<LlmBudgetUtilizationMeter />);

    expect(await screen.findByTestId("llm-budget-utilization-inactive")).toBeInTheDocument();
  });

  it("shows utilization percent when monitoring is active", async () => {
    fetchStatus.mockResolvedValue({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 100,
      effectiveHardCapUsd: 100,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 80,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 0.8,
      warnFraction: 0.75,
    });

    renderWithOperatorQuery(<LlmBudgetUtilizationMeter />);

    expect(await screen.findByTestId("llm-budget-utilization-meter")).toBeInTheDocument();
    expect(screen.getByText("80% used")).toBeInTheDocument();
    expect(screen.getByText(/Approaching the configured warn threshold/)).toBeInTheDocument();
  });
});
