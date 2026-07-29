import { describe, expect, it } from "vitest";

import { DEFAULT_AI_USAGE_DASHBOARD_FILTERS } from "@/lib/ai-usage-dashboard-filters";
import { buildAiUsageDashboardDerived } from "@/lib/ai-usage-dashboard-model";

import { isAiUsageQuietEmptyPeriod } from "./is-ai-usage-quiet-empty-period";

describe("isAiUsageQuietEmptyPeriod (TB-1217)", () => {
  it("is false while cost reporting is still loading", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: null,
      costReportingLoading: true,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: null,
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: null,
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: false,
      canManageBudget: false,
    });

    expect(isAiUsageQuietEmptyPeriod(derived, true)).toBe(false);
  });

  it("is false while budget/admin slices are still loading", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: {
        daily: [],
        byWorkspaceProject: [],
        topRuns: [],
        currency: "USD",
        isMocked: false,
      },
      costReportingLoading: false,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: null,
      budgetLoading: true,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: null,
      adminLoading: true,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: true,
      canManageBudget: true,
    });

    expect(isAiUsageQuietEmptyPeriod(derived, false)).toBe(false);
  });

  it("is false when daily buckets have tokens but no USD", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: {
        daily: [{ bucketUtc: "2026-07-01T00:00:00Z", estimatedCostUsd: 0, promptTokens: 12, completionTokens: 0 }],
        byWorkspaceProject: [],
        topRuns: [],
        currency: "USD",
        isMocked: false,
      },
      costReportingLoading: false,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: null,
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: null,
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: false,
      canManageBudget: false,
    });

    expect(derived.costReportingState).toBe("ready");
    expect(isAiUsageQuietEmptyPeriod(derived, false)).toBe(false);
  });

  it("is true for a settled empty period", () => {
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

    expect(isAiUsageQuietEmptyPeriod(derived, false)).toBe(true);
  });
});
