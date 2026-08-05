import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function openMoreMenu(): void {
  fireEvent.click(screen.getByTestId("operator-shell-topbar-more-trigger"));
}

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

  it("keeps the top bar on one row and parks secondary tools in a more menu", async () => {
    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const sessionRail = screen.getByTestId("app-shell-topbar-session");
    const contextRail = screen.getByTestId("app-shell-topbar-context");

    expect(screen.getByTestId("app-shell-topbar")).not.toHaveClass("overflow-x-hidden");
    expect(sessionRail.className).toMatch(/\bflex-nowrap\b/);
    expect(contextRail.className).toMatch(/\bflex-nowrap\b/);
    expect(screen.getByTestId("operator-shell-topbar-more-trigger")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-shell-help-trigger")).not.toBeInTheDocument();

    openMoreMenu();

    expect(screen.getByTestId("operator-shell-help-trigger")).toHaveAttribute("aria-label", "Help (F1)");
    expect(await screen.findByTestId("llm-budget-status-pill")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-shell-resources-trigger")).not.toBeInTheDocument();
    expect(screen.getByTestId("archlucid-wordmark-link")).toHaveAttribute(
      "aria-label",
      PERSONA_SHELL_WORDMARK_ARIA_LABEL,
    );
  });

  it("renders workspace chrome before the more-menu overflow tools", async () => {
    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const sessionRail = screen.getByTestId("app-shell-topbar-session");
    const contextRail = screen.getByTestId("app-shell-topbar-context");
    const scopeTrigger = screen.getByTestId("operator-scope-switcher-trigger");
    const moreTrigger = screen.getByTestId("operator-shell-topbar-more-trigger");

    expect(sessionRail.contains(contextRail)).toBe(true);
    expect(contextRail.contains(scopeTrigger)).toBe(true);
    expect(screen.queryByTestId("executive-operator-shell-switcher")).not.toBeInTheDocument();
    expect(scopeTrigger.compareDocumentPosition(moreTrigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    openMoreMenu();
    expect(await screen.findByTestId("llm-budget-status-pill")).toBeInTheDocument();
  });

  it("does not leave help triggers in the session rail until more is opened", () => {
    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const sessionRail = screen.getByTestId("app-shell-topbar-session");
    const helpTriggers = sessionRail.querySelectorAll("[data-help-tooltip-trigger]");

    expect(helpTriggers).toHaveLength(0);
    openMoreMenu();
    expect(screen.getByTestId("operator-shell-help-trigger")).toHaveAttribute("data-help-tooltip-icon", "help");
  });

  it("omits dev-only chrome in buyer-default shell mode but keeps help in more menu", () => {
    fullShellMock.value = false;

    render(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    openMoreMenu();
    expect(screen.getByTestId("operator-shell-help-trigger")).toHaveAttribute("aria-label", "Help (F1)");
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

    openMoreMenu();

    await waitFor(() => {
      expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    });

    expect(fetchBudgetCached).not.toHaveBeenCalled();
  });
});
