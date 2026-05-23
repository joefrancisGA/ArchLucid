import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LlmBudgetApproachingLimitBanner,
  shouldShowLlmBudgetApproachingBanner,
} from "@/components/LlmBudgetApproachingLimitBanner";

const fetchCached = vi.hoisted(() => vi.fn());

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchCached,
  };
});

describe("shouldShowLlmBudgetApproachingBanner", () => {
  it("returns true at warn utilization", () => {
    expect(
      shouldShowLlmBudgetApproachingBanner({
        monthlyBudgetMonitoringActive: true,
        blocksAdditionalLlmExecution: false,
        utcMonth: "2026-05",
        hardCutoffUsdPerUtcMonth: 75,
        effectiveHardCapUsd: 75,
        purchasedCapBumpUsd: 0,
        estimatedUsdPressure: 56,
        assumedNextCallReservationUsd: 1,
        hardCapUtilizationFraction: 0.76,
        warnFraction: 0.75,
      }),
    ).toBe(true);
  });

  it("returns false below warn utilization", () => {
    expect(
      shouldShowLlmBudgetApproachingBanner({
        monthlyBudgetMonitoringActive: true,
        blocksAdditionalLlmExecution: false,
        utcMonth: "2026-05",
        hardCutoffUsdPerUtcMonth: 75,
        effectiveHardCapUsd: 75,
        purchasedCapBumpUsd: 0,
        estimatedUsdPressure: 30,
        assumedNextCallReservationUsd: 1,
        hardCapUtilizationFraction: 0.4,
        warnFraction: 0.75,
      }),
    ).toBe(false);
  });
});

describe("LlmBudgetApproachingLimitBanner", () => {
  beforeEach(() => {
    fetchCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 56,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 0.76,
      warnFraction: 0.75,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows warning copy when utilization crosses warn fraction", async () => {
    render(<LlmBudgetApproachingLimitBanner />);

    expect(
      await screen.findByTestId("llm-budget-approaching-limit-banner"),
    ).toHaveTextContent(/Approaching monthly LLM budget limit/);
  });

  it("hides for the session after dismiss", async () => {
    render(<LlmBudgetApproachingLimitBanner />);

    expect(await screen.findByTestId("llm-budget-approaching-limit-banner")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Dismiss LLM budget warning/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("llm-budget-approaching-limit-banner")).not.toBeInTheDocument();
    });
  });
});
