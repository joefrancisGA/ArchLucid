import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LlmBudgetApproachingLimitBanner,
  shouldShowLlmBudgetApproachingBanner,
} from "@/components/llm/LlmBudgetApproachingLimitBanner";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

const fetchStatus = vi.hoisted(() => vi.fn());
const navAuthMock = vi.hoisted(() => ({
  callerAuthorityRank: 100,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => navAuthMock.callerAuthorityRank,
}));

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatus: fetchStatus,
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isNextPublicDemoMode: () => false,
    isOperatorExperienceFullShellEnv: () => true,
  };
});

vi.mock("@/lib/operator/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-static-demo")>();

  return {
    ...actual,
    isStaticDemoPayloadFallbackEnabled: () => false,
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
    resetOperatorQueryClientForTests();
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
    fetchStatus.mockResolvedValue({
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
    renderWithOperatorQuery(<LlmBudgetApproachingLimitBanner />);

    expect(
      await screen.findByTestId("llm-budget-approaching-limit-banner"),
    ).toHaveTextContent(/Approaching monthly LLM budget limit/);
  });

  it("hides for the session after dismiss", async () => {
    renderWithOperatorQuery(<LlmBudgetApproachingLimitBanner />);

    expect(await screen.findByTestId("llm-budget-approaching-limit-banner")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() => {
      expect(screen.queryByTestId("llm-budget-approaching-limit-banner")).not.toBeInTheDocument();
    });
  });

  it("hides for Execute seats without admin authority", async () => {
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    renderWithOperatorQuery(<LlmBudgetApproachingLimitBanner />);

    await waitFor(() => {
      expect(fetchStatus).not.toHaveBeenCalled();
    });

    expect(screen.queryByTestId("llm-budget-approaching-limit-banner")).not.toBeInTheDocument();
  });
});
