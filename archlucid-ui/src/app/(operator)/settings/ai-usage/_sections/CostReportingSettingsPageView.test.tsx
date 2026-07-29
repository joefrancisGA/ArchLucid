import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_AI_USAGE_DASHBOARD_FILTERS } from "@/lib/ai-usage-dashboard-filters";
import { buildAiUsageDashboardDerived } from "@/lib/ai-usage-dashboard-model";

import { CostReportingSettingsPageView } from "./CostReportingSettingsPageView";
import type { CostReportingSettingsPageViewModel } from "./cost-reporting-settings-page-view-model";

function buildQuietEmptyModel(overrides: Partial<CostReportingSettingsPageViewModel> = {}): CostReportingSettingsPageViewModel {
  const derived = buildAiUsageDashboardDerived({
    costReporting: {
      daily: [{ bucketUtc: "2026-07-01T00:00:00Z", estimatedCostUsd: 0, promptTokens: 0, completionTokens: 0 }],
      byWorkspaceProject: [],
      topRuns: [],
      currency: "USD",
      isMocked: false,
    },
    costReportingLoading: false,
    costReportingError: false,
    costReportingDelayed: false,
    budgetStatus: {
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-07",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 0,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 0,
      warnFraction: 0.75,
      remainingBudgetUsd: 75,
    },
    budgetLoading: false,
    budgetError: false,
    budgetForbidden: false,
    adminDashboard: {
      budgetAmountUsd: 75,
      usedAmountUsd: 0,
      remainingAmountUsd: 75,
      resetPeriod: "UTC month",
      hardStopEnabled: true,
      trialExpirationUtc: null,
      workspaceKind: "Trial",
      customerAiProviderConfigured: true,
      usageByFeatureUsd: {},
      recentEvents: [],
    },
    adminLoading: false,
    adminError: false,
    adminForbidden: false,
    filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
    canViewBudgetDetails: true,
    canManageBudget: true,
  });

  return {
    surface: "granted",
    loading: false,
    data: {
      daily: [{ bucketUtc: "2026-07-01T00:00:00Z", estimatedCostUsd: 0, promptTokens: 0, completionTokens: 0 }],
      byWorkspaceProject: [],
      topRuns: [],
      currency: "USD",
      isMocked: false,
    },
    budgetStatus: null,
    adminDashboard: null,
    derived,
    filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
    canViewBudgetDetails: true,
    canManageBudget: true,
    showDetailedActivityLink: false,
    load: vi.fn(async () => undefined),
    setFilters: vi.fn(),
    ...overrides,
  };
}

describe("CostReportingSettingsPageView (TB-1217)", () => {
  it("leads with a quiet empty story — not a zeroed On track dashboard", () => {
    render(<CostReportingSettingsPageView model={buildQuietEmptyModel()} />);

    expect(screen.getByTestId("ai-usage-period-zero-state")).toBeInTheDocument();
    expect(screen.getByTestId("ai-usage-quiet-budget-cap")).toHaveTextContent("$75");
    expect(screen.queryByTestId("ai-usage-kpi-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ai-usage-monthly-budget-panel")).not.toBeInTheDocument();
    expect(screen.queryByText(/On track/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("ai-usage-filters-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ai-usage-daily-usage-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ai-usage-cost-breakdown-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("workspace-budget-status-card")).toBeInTheDocument();
  });
});
