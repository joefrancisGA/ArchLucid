import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorShellTopBar } from "@/components/shell/OperatorShellTopBar";
import { TooltipProvider } from "@/components/ui/tooltip";
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

describe("OperatorShellTopBar", () => {
  beforeEach(() => {
    buyerPolishedMock.value = false;
    fetchBudgetCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 10,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 0.15,
      warnFraction: 0.75,
    });
  });

  it("renders primary and secondary header rails so utilities can wrap", async () => {
    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("app-shell-topbar")).toHaveClass("overflow-x-hidden");
    expect(screen.getByTestId("app-shell-topbar-primary")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell-topbar-secondary")).toHaveClass("w-full");
    expect(screen.getByTestId("trust-center-shell-link")).toBeInTheDocument();
    expect(await screen.findByTestId("llm-budget-status-pill")).toBeInTheDocument();
    expect(screen.queryByTestId("shell-setup-health-chip")).not.toBeInTheDocument();
  });

  it("omits dev-only chrome in buyer-polished shell mode", () => {
    buyerPolishedMock.value = true;

    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    expect(screen.queryByTestId("shell-setup-health-chip")).not.toBeInTheDocument();
    expect(screen.getByTestId("trust-center-shell-link")).toBeInTheDocument();
  });
});
