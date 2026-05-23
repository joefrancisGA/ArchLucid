import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LlmUsageBandHint } from "@/components/LlmUsageBandHint";

const fetchCached = vi.hoisted(() => vi.fn());
const buyerPolishedMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchCached,
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/lib/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

describe("LlmUsageBandHint", () => {
  beforeEach(() => {
    buyerPolishedMock.value = false;
    fetchCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 60,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 0.8,
      warnFraction: 0.75,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows approximate percent remaining at warn utilization in buyer-polished shell", async () => {
    buyerPolishedMock.value = true;

    render(<LlmUsageBandHint />);

    expect(await screen.findByTestId("llm-usage-band-hint-approaching")).toHaveTextContent(
      /approximately 20% remaining/i,
    );
    expect(screen.getByTestId("llm-usage-band-hint-approaching")).not.toHaveTextContent(/nearly used/i);
  });

  it("is hidden in operator shell mode", async () => {
    buyerPolishedMock.value = false;

    render(<LlmUsageBandHint />);

    await waitFor(() => {
      expect(fetchCached).not.toHaveBeenCalled();
    });

    expect(screen.queryByTestId("llm-usage-band-hint-approaching")).toBeNull();
    expect(screen.queryByTestId("llm-usage-band-hint-exhausted")).toBeNull();
  });

  it("shows exhausted copy with pricing link when execution is blocked", async () => {
    buyerPolishedMock.value = true;
    fetchCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: true,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 80,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 1.05,
      warnFraction: 0.75,
    });

    render(<LlmUsageBandHint />);

    expect(await screen.findByTestId("llm-usage-band-hint-exhausted")).toHaveTextContent(/0% remaining/i);
    expect(screen.getByRole("link", { name: /View pricing and request a quote/i })).toHaveAttribute(
      "href",
      "/pricing#pricing-quote-request",
    );
  });
});
