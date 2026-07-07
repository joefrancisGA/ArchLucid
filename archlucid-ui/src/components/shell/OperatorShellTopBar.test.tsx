import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorShellTopBar } from "@/components/shell/OperatorShellTopBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";
import { OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS } from "@/lib/design-tokens";
import { GLOBAL_SEARCH_ARIA_LABEL } from "@/lib/keyboard-shortcut-display";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { PERSONA_SHELL_WORDMARK_ARIA_LABEL } from "@/lib/persona-shell-vocabulary";

const fullShellMock = vi.hoisted(() => ({ value: true }));
const fetchBudgetCached = vi.hoisted(() => vi.fn());

const navAuthMock = vi.hoisted(() => ({
  callerAuthorityRank: 3,
  isAuthorityLoading: false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: () => fullShellMock.value,
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
      callerAuthorityRank: navAuthMock.callerAuthorityRank,
      isAuthorityLoading: navAuthMock.isAuthorityLoading,
      currentPrincipal: operatorNavOutsideProviderPrincipal,
    }),
    useNavCallerAuthorityRank: () => navAuthMock.callerAuthorityRank,
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

vi.mock("@/components/CommandPaletteLazy", () => ({
  CommandPalette: () => null,
  preloadCommandPaletteChunk: vi.fn(),
}));

describe("OperatorShellTopBar", () => {
  beforeEach(() => {
    fullShellMock.value = true;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
    navAuthMock.isAuthorityLoading = false;
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

  it("reserves a sidebar-width brand rail and left-aligns search in the content column", () => {
    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const brandRail = screen.getByTestId("app-shell-topbar-primary");
    const searchInput = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });

    expect(brandRail).toHaveClass(OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS);
    expect(brandRail.compareDocumentPosition(searchInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(searchInput.closest(".mx-auto")).toBeNull();
  });

  it("renders a single header rail with help and without resources flyout", async () => {
    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("app-shell-topbar")).toHaveClass("overflow-x-hidden");
    expect(screen.getByTestId("app-shell-topbar-primary")).toBeInTheDocument();
    expect(screen.queryByTestId("active-tenant-context-badge")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-shell-topbar-context")).toBeInTheDocument();
    expect(screen.getByTestId("archlucid-wordmark-link")).toHaveAttribute(
      "aria-label",
      PERSONA_SHELL_WORDMARK_ARIA_LABEL,
    );
    expect(screen.queryByTestId("app-shell-topbar-secondary")).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-shell-help-trigger")).toHaveAttribute("aria-label", "Help (F1)");
    expect(screen.getByTestId("operator-shell-help-trigger")).toHaveAttribute("aria-keyshortcuts", "F1 Shift+?");
    expect(screen.queryByTestId("operator-shell-resources-trigger")).not.toBeInTheDocument();
    expect(await screen.findByTestId("llm-budget-status-pill")).toBeInTheDocument();
    expect(screen.queryByTestId("shell-setup-health-chip")).not.toBeInTheDocument();
  });

  it("renders workspace chrome before the deprioritized allowance pill", async () => {
    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const sessionRail = screen.getByTestId("app-shell-topbar-session");
    const contextRail = screen.getByTestId("app-shell-topbar-context");
    const scopeTrigger = screen.getByTestId("operator-scope-switcher-trigger");
    const allowancePill = await screen.findByTestId("llm-budget-status-pill");
    const helpTrigger = screen.getByTestId("operator-shell-help-trigger");

    expect(sessionRail.contains(contextRail)).toBe(true);
    expect(contextRail.contains(scopeTrigger)).toBe(true);
    expect(screen.queryByTestId("executive-operator-shell-switcher")).not.toBeInTheDocument();
    expect(sessionRail.contains(allowancePill)).toBe(true);
    expect(scopeTrigger.compareDocumentPosition(allowancePill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(helpTrigger.compareDocumentPosition(allowancePill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not render contextual help triggers in the top toolbar session rail", async () => {
    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const sessionRail = screen.getByTestId("app-shell-topbar-session");
    const helpTriggers = sessionRail.querySelectorAll("[data-help-tooltip-trigger]");

    expect(helpTriggers).toHaveLength(1);
    expect(helpTriggers[0]).toHaveAttribute("data-testid", "operator-shell-help-trigger");
    expect(helpTriggers[0]).toHaveAttribute("data-help-tooltip-icon", "help");
  });

  it("omits dev-only chrome in buyer-default shell mode but keeps help", () => {
    fullShellMock.value = false;

    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("operator-shell-help-trigger")).toHaveAttribute("aria-label", "Help (F1)");
    expect(screen.getByTestId("operator-shell-help-trigger")).toHaveAttribute("aria-keyshortcuts", "F1 Shift+?");
    expect(screen.queryByTestId("operator-shell-resources-trigger")).not.toBeInTheDocument();
    expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    expect(screen.queryByTestId("shell-setup-health-chip")).not.toBeInTheDocument();
  });

  it("omits the AI budget pill for callers below AdminAuthority", async () => {
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    });

    expect(fetchBudgetCached).not.toHaveBeenCalled();
  });
});
