import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorShellTopBar } from "@/components/shell/OperatorShellTopBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";
import { OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS } from "@/lib/design-tokens";
import { GLOBAL_SEARCH_ARIA_LABEL } from "@/lib/keyboard-shortcut-display";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { PERSONA_SHELL_WORDMARK_ARIA_LABEL } from "@/lib/vocabulary/persona-shell-vocabulary";

const fullShellMock = vi.hoisted(() => ({ value: true }));
const fetchBudgetStatus = vi.hoisted(() => vi.fn());
const authorityThemeEvalMock = vi.hoisted(() => ({ value: false }));

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

vi.mock("@/lib/ui-authority-theme", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ui-authority-theme")>();

  return {
    ...actual,
    isUiAuthorityThemeEvalEnabledEnv: () => authorityThemeEvalMock.value,
  };
});

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatus: fetchBudgetStatus,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/operator/OperatorNavAuthorityProvider")>();

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
    resetOperatorQueryClientForTests();
    fullShellMock.value = true;
    authorityThemeEvalMock.value = false;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
    navAuthMock.isAuthorityLoading = false;
    fetchBudgetStatus.mockReset();
    fetchBudgetStatus.mockResolvedValue({
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

  it("reserves a sidebar-width brand rail and left-aligns search in the content column", async () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const brandRail = screen.getByTestId("app-shell-topbar-primary");
    const searchInput = await screen.findByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });

    expect(brandRail).toHaveClass(OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS);
    expect(brandRail.compareDocumentPosition(searchInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(searchInput.closest(".mx-auto")).toBeNull();
  });

  it("exposes Help on the top bar without opening the more menu", () => {
    const onOpenHelpSearch = vi.fn();

    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={onOpenHelpSearch} />
      </TooltipProvider>,
    );

    const help = screen.getByTestId("operator-shell-help-trigger");

    expect(help).toHaveAttribute("aria-label", "Help and support (F1)");
    expect(help).toHaveAttribute("data-help-tooltip-icon", "help");
    expect(screen.getByTestId("app-shell-topbar-session").contains(help)).toBe(true);

    fireEvent.click(help);
    expect(onOpenHelpSearch).toHaveBeenCalledTimes(1);
  });

  it("keeps the top bar on one row and shows AI budget when utilization is warn/critical", async () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const sessionRail = screen.getByTestId("app-shell-topbar-session");
    const contextRail = screen.getByTestId("app-shell-topbar-context");

    expect(screen.getByTestId("app-shell-topbar")).not.toHaveClass("overflow-x-hidden");
    expect(sessionRail.className).toMatch(/\bflex-nowrap\b/);
    expect(contextRail.className).toMatch(/\bflex-nowrap\b/);
    expect(screen.getByTestId("operator-shell-help-trigger")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-shell-topbar-more-trigger")).not.toBeInTheDocument();
    // The budget pill is a dynamic chunk; a cold import can exceed the default findBy timeout.
    expect(await screen.findByTestId("llm-budget-status-pill", {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.queryByTestId("operator-shell-resources-trigger")).not.toBeInTheDocument();
    expect(screen.getByTestId("archlucid-wordmark-link")).toHaveAttribute(
      "aria-label",
      PERSONA_SHELL_WORDMARK_ARIA_LABEL,
    );
  });

  it("hides the AI budget pill when remaining budget is healthy", async () => {
    fetchBudgetStatus.mockResolvedValue({
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

    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    await waitFor(() => {
      expect(fetchBudgetStatus).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
  });

  it("renders workspace chrome before Help and AI usage on the toolbar", async () => {
    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    const sessionRail = screen.getByTestId("app-shell-topbar-session");
    const contextRail = screen.getByTestId("app-shell-topbar-context");
    const scopeTrigger = await screen.findByTestId("operator-scope-switcher-trigger");
    const helpTrigger = screen.getByTestId("operator-shell-help-trigger");
    const budgetPill = await screen.findByTestId("llm-budget-status-pill");

    expect(sessionRail.contains(contextRail)).toBe(true);
    expect(contextRail.contains(scopeTrigger)).toBe(true);
    expect(screen.queryByTestId("executive-operator-shell-switcher")).not.toBeInTheDocument();
    expect(scopeTrigger.compareDocumentPosition(helpTrigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(helpTrigger.compareDocumentPosition(budgetPill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByTestId("operator-shell-topbar-more-trigger")).not.toBeInTheDocument();
  });

  it("omits AI usage and the more menu in buyer-default shell", () => {
    fullShellMock.value = false;

    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("operator-shell-help-trigger")).toHaveAttribute("aria-label", "Help and support (F1)");
    expect(screen.queryByTestId("operator-shell-topbar-more-trigger")).not.toBeInTheDocument();
    expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    expect(screen.queryByTestId("shell-setup-health-chip")).not.toBeInTheDocument();
  });

  it("omits the AI budget pill for callers below AdminAuthority", async () => {
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("operator-shell-help-trigger")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-shell-topbar-more-trigger")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    });

    expect(fetchBudgetStatus).not.toHaveBeenCalled();
  });

  it("keeps the more menu only for the eval authority theme toggle", async () => {
    authorityThemeEvalMock.value = true;

    renderWithOperatorQuery(
      <TooltipProvider>
        <OperatorShellTopBar onOpenHelpSearch={vi.fn()} />
      </TooltipProvider>,
    );

    expect(await screen.findByTestId("llm-budget-status-pill")).toBeInTheDocument();
    expect(await screen.findByTestId("operator-shell-topbar-more-trigger")).toBeInTheDocument();

    openMoreMenu();

    expect(await screen.findByTestId("app-shell-topbar-more-tools")).toBeInTheDocument();
    expect(screen.getByTestId("llm-budget-status-pill")).toBeInTheDocument();
  });
});
