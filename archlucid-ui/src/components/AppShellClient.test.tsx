import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShellClient } from "@/components/AppShellClient";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const buyerPolishedMock = vi.hoisted(() => ({ value: false }));
const fetchBudgetCached = vi.hoisted(() => vi.fn());

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchBudgetCached,
  };
});

vi.mock("@/components/OperatorNavAuthorityProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/OperatorNavAuthorityProvider")>();

  return {
    ...actual,
    useOperatorNavAuthority: () => ({
      callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
      isAuthorityLoading: false,
      currentPrincipal: operatorNavOutsideProviderPrincipal,
    }),
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/components/SidebarNav", () => ({
  SidebarNav: () => <div data-testid="sidebar-nav-stub" />,
}));

describe("AppShellClient — LLM budget chrome", () => {
  beforeEach(() => {
    buyerPolishedMock.value = false;
    fetchBudgetCached.mockResolvedValue({
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

  it("shows budget pill and approaching banner in operator shell mode", async () => {
    render(
      <AppShellClient>
        <div>child</div>
      </AppShellClient>,
    );

    expect(await screen.findByTestId("llm-budget-status-pill")).toBeInTheDocument();
    expect(await screen.findByTestId("llm-budget-approaching-limit-banner")).toBeInTheDocument();
  });

  it("hides budget pill in buyer-polished shell mode", async () => {
    buyerPolishedMock.value = true;

    render(
      <AppShellClient>
        <div>child</div>
      </AppShellClient>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    });
  });
});
