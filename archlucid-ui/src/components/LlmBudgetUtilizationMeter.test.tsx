import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LlmBudgetUtilizationMeter } from "@/components/LlmBudgetUtilizationMeter";

const fetchCached = vi.hoisted(() => vi.fn());

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchCached,
  };
});

describe("LlmBudgetUtilizationMeter", () => {
  it("renders inactive copy when monitoring is off", async () => {
    fetchCached.mockResolvedValue({
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

    render(<LlmBudgetUtilizationMeter />);

    expect(await screen.findByTestId("llm-budget-utilization-inactive")).toBeInTheDocument();
  });

  it("shows utilization percent when monitoring is active", async () => {
    fetchCached.mockResolvedValue({
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

    render(<LlmBudgetUtilizationMeter />);

    expect(await screen.findByTestId("llm-budget-utilization-meter")).toBeInTheDocument();
    expect(screen.getByText("80% of cap")).toBeInTheDocument();
    expect(screen.getByText(/Approaching warn threshold/)).toBeInTheDocument();
  });
});
