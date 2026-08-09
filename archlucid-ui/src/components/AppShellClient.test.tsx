import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShellClient } from "@/components/AppShellClient";
import { OPERATOR_SHELL_BODY_ROW_CLASS, OPERATOR_SHELL_SIDEBAR_WIDTH_CLASS } from "@/lib/design-tokens";
import { PERSONA_SHELL_WORDMARK_ARIA_LABEL } from "@/lib/persona-shell-vocabulary";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const fullShellMock = vi.hoisted(() => ({ value: true }));
const fetchBudgetStatus = vi.hoisted(() => vi.fn());
const fetchBudgetStatusCached = vi.hoisted(() => vi.fn());

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
    fetchLlmMonthlyDollarBudgetStatus: fetchBudgetStatus,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchBudgetStatusCached,
  };
});

vi.mock("@/lib/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator-static-demo")>();

  return {
    ...actual,
    isStaticDemoPayloadFallbackEnabled: () => false,
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

vi.mock("@/components/SidebarNav", () => ({
  SidebarNav: () => <div data-testid="sidebar-nav-stub" />,
}));

vi.mock("@/components/shell/AppShellStatusBanners", () => ({
  AppShellStatusBanners: () => <div data-testid="llm-budget-approaching-limit-banner" />,
}));

vi.mock("@/components/shell/AppShellKeyboardShortcutBoundary", () => ({
  AppShellKeyboardShortcutBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/shell/app-shell-deferred-chunks", async () => {
  const { OperatorShellTopBar } = await import("@/components/shell/OperatorShellTopBar");
  const { AppShellWorkspaceFooter } = await import("@/components/shell/AppShellWorkspaceFooter");
  const { AppShellIdleOverlays } = await import("@/components/shell/AppShellIdleOverlays");
  const { DevTestingShellShortcuts } = await import("@/components/dev-testing/DevTestingShellShortcuts");
  const { AppShellTelemetryBundle } = await import("@/components/shell/AppShellTelemetryBundle");
  const { SessionIdleTimeoutGuard } = await import("@/components/SessionIdleTimeoutGuard");
  const { AuthPanel } = await import("@/components/AuthPanel");
  const { SyncActiveRunFromPathname } = await import("@/components/SyncActiveRunFromPathname");
  const { AppShellMainContentGate } = await import("@/components/shell/AppShellMainContentGate");

  return {
    OperatorShellTopBarDeferred: OperatorShellTopBar,
    AppShellWorkspaceFooterDeferred: AppShellWorkspaceFooter,
    AppShellIdleOverlaysDeferred: AppShellIdleOverlays,
    DevTestingShellShortcutsDeferred: DevTestingShellShortcuts,
    AppShellTelemetryBundleDeferred: AppShellTelemetryBundle,
    SessionIdleTimeoutGuardDeferred: SessionIdleTimeoutGuard,
    AuthPanelDeferred: AuthPanel,
    SyncActiveRunFromPathnameDeferred: SyncActiveRunFromPathname,
    AppShellMainContentGateDeferred: AppShellMainContentGate,
  };
});

describe("AppShellClient — LLM budget chrome", () => {
  useOperatorQueryTestLifecycle();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    fullShellMock.value = true;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
    navAuthMock.isAuthorityLoading = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("/api/proxy/health/ready")) {
          return new Response(JSON.stringify({ status: "Healthy", entries: [] }), { status: 200 });
        }

        return new Response("not found", { status: 404 });
      }),
    );
    const budgetStatus = {
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
    };

    fetchBudgetStatus.mockResolvedValue(budgetStatus);
    fetchBudgetStatusCached.mockResolvedValue(budgetStatus);
  });

  it("shows budget pill and approaching banner for AdminAuthority in operator shell mode", async () => {
    renderWithOperatorQuery(
      <AppShellClient>
        <div>child</div>
      </AppShellClient>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("operator-shell-help-trigger")).toBeInTheDocument();
      expect(screen.getByTestId("llm-budget-status-pill")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("operator-shell-topbar-more-trigger")).not.toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByTestId("llm-budget-approaching-limit-banner")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("hides budget pill for callers below AdminAuthority", async () => {
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    renderWithOperatorQuery(
      <AppShellClient>
        <div>child</div>
      </AppShellClient>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("operator-shell-help-trigger")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("operator-shell-topbar-more-trigger")).not.toBeInTheDocument();
    expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
    expect(fetchBudgetStatusCached).not.toHaveBeenCalled();
  });

  it("hides budget pill in buyer-default shell mode", async () => {
    fullShellMock.value = false;

    renderWithOperatorQuery(
      <AppShellClient>
        <div>child</div>
      </AppShellClient>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("operator-shell-help-trigger")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("operator-shell-topbar-more-trigger")).not.toBeInTheDocument();
    expect(screen.queryByTestId("llm-budget-status-pill")).not.toBeInTheDocument();
  });

  it("keeps sticky chrome to trial banner + top bar and leaves journey caption outside sticky", async () => {
    renderWithOperatorQuery(
      <AppShellClient>
        <div>child</div>
      </AppShellClient>,
    );

    const sticky = await screen.findByTestId("app-shell-sticky-header");
    const topbar = screen.getByTestId("app-shell-topbar");
    const journey = screen.queryByTestId("cto-demo-journey-caption-bar");

    expect(sticky.contains(topbar)).toBe(true);
    expect(sticky.querySelector("[data-testid='app-shell-topbar']")).not.toBeNull();

    if (journey !== null) {
      expect(sticky.contains(journey)).toBe(false);
    }
  });
});

describe("AppShellClient — shell chrome labels", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    fullShellMock.value = true;
    navAuthMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
    navAuthMock.isAuthorityLoading = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ status: "Healthy", entries: [] }), { status: 200 })),
    );
    fetchBudgetStatusCached.mockResolvedValue({
      monthlyBudgetMonitoringActive: false,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-05",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 0,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 0,
      warnFraction: 0.75,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not render an Architect | Executive shell switcher or Operator persona labels in the top bar", async () => {
    renderWithOperatorQuery(
      <AppShellClient>
        <div>child</div>
      </AppShellClient>,
    );

    const topbar = await screen.findByTestId("app-shell-topbar");

    expect(screen.queryByTestId("executive-operator-shell-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("archlucid-wordmark-link")).toHaveAttribute(
      "aria-label",
      PERSONA_SHELL_WORDMARK_ARIA_LABEL,
    );
    expect(topbar.textContent?.toLowerCase() ?? "").not.toContain("operator");
  });

  it("left-aligns the sidebar row with the top bar and reserves a fixed sidebar width", async () => {
    renderWithOperatorQuery(
      <AppShellClient>
        <div>child</div>
      </AppShellClient>,
    );

    const sidebarNav = await screen.findByTestId("sidebar-nav");
    const sidebarRow = sidebarNav.parentElement;

    expect(sidebarRow).not.toBeNull();
    expect(sidebarRow?.className).toContain(OPERATOR_SHELL_BODY_ROW_CLASS);
    expect(sidebarRow?.className).not.toMatch(/mx-auto/);
    expect(sidebarNav).toHaveClass(OPERATOR_SHELL_SIDEBAR_WIDTH_CLASS);
  });

  it("defers sidebar and top bar while operator authority is loading", () => {
    navAuthMock.isAuthorityLoading = true;

    renderWithOperatorQuery(
      <AppShellClient>
        <div data-testid="protected-child">child</div>
      </AppShellClient>,
    );

    expect(screen.getByTestId("operator-shell-access-gate-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-nav")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-shell-topbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
  });

  it("keeps data-app-ready on the shell root after deferred access chrome resolves", async () => {
    navAuthMock.isAuthorityLoading = true;

    const view = renderWithOperatorQuery(
      <AppShellClient>
        <div data-testid="protected-child">child</div>
      </AppShellClient>,
    );

    expect(document.querySelector('[data-app-ready="true"]')).not.toBeNull();

    navAuthMock.isAuthorityLoading = false;
    view.rerender(
      <AppShellClient>
        <div data-testid="protected-child">child</div>
      </AppShellClient>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-nav")).toBeInTheDocument();
    });

    expect(document.querySelector('[data-app-ready="true"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-app-ready="true"]')).toHaveLength(1);
  });
});
