import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOperatorQueryClient } from "@/lib/query/operator-query-client";

const nav = vi.hoisted(() => ({
  callerAuthorityRank: 3,
  isAuthorityLoading: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/administration/ai-usage",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Admin User",
      roleClaimValues: ["Admin"],
      primaryAppRole: "Admin" as const,
      maxAuthority: "AdminAuthority" as const,
      authorityRank: nav.callerAuthorityRank,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      permissionClaimValues: [],
    },
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: nav.isAuthorityLoading,
  }),
}));

const hoistedCostReportingLoad = vi.hoisted(() => ({ demo: false }));

vi.mock("./_sections/load-cost-reporting-settings-page-data", () => ({
  loadCostReportingSettingsPageData: () => Promise.resolve(hoistedCostReportingLoad),
}));

const fetchBudgetCached = vi.hoisted(() => vi.fn());
const fetchAdminDashboard = vi.hoisted(() => vi.fn());

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchBudgetCached,
  };
});

vi.mock("@/lib/admin-ai-usage-dashboard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-ai-usage-dashboard")>();

  return {
    ...actual,
    fetchAdminAiUsageDashboard: fetchAdminDashboard,
  };
});

import CostReportingSettingsPage from "./page";

function mockBudgetAndAdmin() {
  fetchBudgetCached.mockResolvedValue({
    monthlyBudgetMonitoringActive: true,
    blocksAdditionalLlmExecution: false,
    utcMonth: "2026-07",
    hardCutoffUsdPerUtcMonth: 75,
    effectiveHardCapUsd: 75,
    purchasedCapBumpUsd: 0,
    estimatedUsdPressure: 25,
    assumedNextCallReservationUsd: 1,
    hardCapUtilizationFraction: 25 / 75,
    warnFraction: 0.75,
    remainingBudgetUsd: 50,
  });

  fetchAdminDashboard.mockResolvedValue({
    budgetAmountUsd: 75,
    usedAmountUsd: 25,
    remainingAmountUsd: 50,
    resetPeriod: "UTC month",
    hardStopEnabled: true,
    trialExpirationUtc: null,
    workspaceKind: "Trial",
    customerAiProviderConfigured: true,
    usageByFeatureUsd: { ReviewAnalysis: 20, EvidenceQa: 5 },
    recentEvents: [
      {
        occurredUtc: "2026-07-01T12:00:00Z",
        feature: "ReviewAnalysis",
        providerKind: "azure-openai",
        estimatedCostUsd: 1.25,
        userId: "user-1",
        servedFromDemoCache: false,
        budgetBlocked: false,
      },
      {
        occurredUtc: "2026-07-02T08:00:00Z",
        feature: "EvidenceIndexing",
        providerKind: "azure-openai",
        estimatedCostUsd: 0,
        userId: null,
        servedFromDemoCache: true,
        budgetBlocked: false,
      },
    ],
  });
}

describe("CostReportingSettingsPage", () => {
  beforeEach(() => {
    nav.callerAuthorityRank = 3;
    nav.isAuthorityLoading = false;
    fetchBudgetCached.mockReset();
    fetchAdminDashboard.mockReset();
    getOperatorQueryClient().clear();
    vi.unstubAllGlobals();
  });

  it("blocks callers without read authority", async () => {
    nav.callerAuthorityRank = 0;

    const page = await CostReportingSettingsPage();

    render(page);
    expect(screen.getByTestId("cost-reporting-forbidden")).toBeInTheDocument();
    nav.callerAuthorityRank = 3;
  });

  it("allows non-admin Read-authority callers to view the report", async () => {
    nav.callerAuthorityRank = 1;
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));
    fetchBudgetCached.mockResolvedValue(null);
    fetchAdminDashboard.mockResolvedValue(null);

    const page = await CostReportingSettingsPage();

    render(page);
    expect(await screen.findByTestId("cost-reporting-mock-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("cost-reporting-forbidden")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
    nav.callerAuthorityRank = 3;
  });

  it("shows mock banner and KPI row when API returns 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));
    mockBudgetAndAdmin();

    const page = await CostReportingSettingsPage();

    render(page);
    expect(await screen.findByTestId("cost-reporting-mock-banner")).toBeInTheDocument();
    expect(await screen.findByTestId("ai-usage-kpi-row")).toBeInTheDocument();
    expect(screen.getByTestId("ai-usage-daily-usage-panel")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("renders workspace budget status instead of governance card", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));
    mockBudgetAndAdmin();

    const page = await CostReportingSettingsPage();

    render(page);
    expect(await screen.findByTestId("workspace-budget-status-card")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-ai-usage-governance-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("workspace-budget-status-summary")).toHaveTextContent("$50.00 remaining of $75.00");
    vi.unstubAllGlobals();
  });

  it("shows recent activity with skipped non-billable badge", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));
    mockBudgetAndAdmin();

    const page = await CostReportingSettingsPage();

    render(page);
    expect(await screen.findByTestId("ai-usage-recent-activity-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ai-usage-recent-activity-panel")).toHaveTextContent("Skipped");
    expect(screen.getByText("AI budget used: $0.00")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("hides detailed activity link for customer shells", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));
    mockBudgetAndAdmin();

    const page = await CostReportingSettingsPage();

    render(page);
    await screen.findByTestId("ai-usage-kpi-row");
    expect(screen.queryByTestId("ai-usage-detailed-activity-details")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("restricts budget panels for read-only callers", async () => {
    nav.callerAuthorityRank = 1;
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));
    fetchBudgetCached.mockResolvedValue(null);
    fetchAdminDashboard.mockResolvedValue(null);

    const page = await CostReportingSettingsPage();

    render(page);
    await screen.findByTestId("ai-usage-kpi-row");
    await waitFor(() => {
      expect(screen.getByTestId("ai-usage-monthly-budget-state-permission-restricted")).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
    nav.callerAuthorityRank = 3;
  });

  it("exposes accessible chart summary for daily usage", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));
    mockBudgetAndAdmin();

    const page = await CostReportingSettingsPage();

    render(page);
    const summary = await screen.findByTestId("ai-usage-daily-chart-summary");
    expect(summary.textContent).toMatch(/Daily estimated cost over 30 days/i);
    vi.unstubAllGlobals();
  });
});
