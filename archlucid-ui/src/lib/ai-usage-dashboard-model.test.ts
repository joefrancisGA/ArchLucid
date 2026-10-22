import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildAiUsageDashboardDerived,
  formatAiUsageBillingPeriodResetLabel,
  formatAiUsageEstimatesAsOfLabel,
  formatAiUsageRemainingBudgetCopy,
  formatAiUsageUsedBudgetCopy,
  inferAiUsageActivityBadge,
  inferAiUsageActivityStatus,
  projectMonthEndSpendUsd,
  resolveUtcMonthPeriodResetUtc,
} from "@/lib/ai-usage-dashboard-model";
import { DEFAULT_AI_USAGE_DASHBOARD_FILTERS } from "@/lib/ai-usage-dashboard-filters";
import { buildMockLlmCostReportingDashboard } from "@/lib/llm-cost-reporting";
import type { AdminAiUsageDashboard, AdminAiUsageEventRow } from "@/lib/admin-ai-usage-dashboard";

function baseEvent(overrides: Partial<AdminAiUsageEventRow> = {}): AdminAiUsageEventRow {
  return {
    occurredUtc: "2026-07-01T12:00:00Z",
    feature: "ReviewAnalysis",
    providerKind: "azure-openai",
    estimatedCostUsd: 1.25,
    userId: "user-1",
    servedFromDemoCache: false,
    budgetBlocked: false,
    ...overrides,
  };
}

function baseAdminDashboard(overrides: Partial<AdminAiUsageDashboard> = {}): AdminAiUsageDashboard {
  return {
    budgetAmountUsd: 75,
    usedAmountUsd: 25,
    remainingAmountUsd: 50,
    resetPeriod: "UTC month",
    hardStopEnabled: true,
    trialExpirationUtc: null,
    workspaceKind: "Trial",
    customerAiProviderConfigured: true,
    usageByFeatureUsd: { ReviewAnalysis: 20, EvidenceQa: 5 },
    recentEvents: [baseEvent()],
    ...overrides,
  };
}

function baseBudgetStatus() {
  return {
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
  };
}

describe("ai-usage-dashboard-model", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 6, 10, 12, 0, 0)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("projects month-end spend from month-to-date usage", () => {
    const reference = new Date(Date.UTC(2026, 6, 10));
    const projected = projectMonthEndSpendUsd(25, reference);

    expect(projected).toBeGreaterThan(25);
  });

  it("formats remaining and used budget copy", () => {
    expect(formatAiUsageRemainingBudgetCopy(50, 75)).toBe("$50.00 remaining of $75.00");
    expect(formatAiUsageUsedBudgetCopy(25, 75)).toBe("$25.00 used of $75.00");
  });

  it("resolves UTC month reset and freshness labels", () => {
    expect(resolveUtcMonthPeriodResetUtc("2026-07")).toBe("2026-08-01T00:00:00.000Z");
    expect(formatAiUsageBillingPeriodResetLabel("2026-08-01T00:00:00.000Z")).toContain("2026");
    expect(formatAiUsageEstimatesAsOfLabel("2026-07-10T12:00:00.000Z")).toContain("Estimates as of");
  });

  it("surfaces delayed cost reporting while the fetch is still loading", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: null,
      costReportingLoading: true,
      costReportingError: false,
      costReportingDelayed: true,
      budgetStatus: null,
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: null,
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: true,
      canManageBudget: true,
    });

    expect(derived.costReportingState).toBe("delayed");
  });

  it("classifies skipped non-billable activity", () => {
    const event = baseEvent({ servedFromDemoCache: true, estimatedCostUsd: 0 });

    expect(inferAiUsageActivityBadge(event)).toBe("Skipped");
    expect(inferAiUsageActivityStatus(event)).toBe("Skipped");
  });

  it("classifies scheduled system-initiated activity", () => {
    const event = baseEvent({ userId: null });

    expect(inferAiUsageActivityBadge(event)).toBe("Scheduled");
  });

  it("builds partial budget usage KPIs", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: buildMockLlmCostReportingDashboard(),
      costReportingLoading: false,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: baseBudgetStatus(),
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: baseAdminDashboard(),
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: true,
      canManageBudget: true,
    });

    expect(derived.kpi.usedThisMonthUsd).toBe(25);
    expect(derived.kpi.remainingBudgetUsd).toBe(50);
    expect(derived.budgetPaceStatus).toBe("on_track");
    expect(derived.activityRows.length).toBe(1);
  });

  it("marks warning threshold as approaching limit", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: buildMockLlmCostReportingDashboard(),
      costReportingLoading: false,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: {
        ...baseBudgetStatus(),
        hardCapUtilizationFraction: 0.8,
        estimatedUsdPressure: 60,
        remainingBudgetUsd: 15,
      },
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: baseAdminDashboard({ usedAmountUsd: 60, remainingAmountUsd: 15 }),
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: true,
      canManageBudget: true,
    });

    expect(derived.budgetPaceStatus).toBe("approaching_limit");
  });

  it("marks exhausted budget", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: buildMockLlmCostReportingDashboard(),
      costReportingLoading: false,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: {
        ...baseBudgetStatus(),
        blocksAdditionalLlmExecution: true,
        hardCapUtilizationFraction: 1,
        estimatedUsdPressure: 75,
        remainingBudgetUsd: 0,
      },
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: baseAdminDashboard({ usedAmountUsd: 75, remainingAmountUsd: 0 }),
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: true,
      canManageBudget: true,
    });

    expect(derived.budgetPaceStatus).toBe("exhausted");
  });

  it("flags projected overspend as at risk", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: buildMockLlmCostReportingDashboard(),
      costReportingLoading: false,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: {
        ...baseBudgetStatus(),
        hardCapUtilizationFraction: 30 / 75,
        estimatedUsdPressure: 30,
        remainingBudgetUsd: 45,
      },
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: baseAdminDashboard({ usedAmountUsd: 30, remainingAmountUsd: 45 }),
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: true,
      canManageBudget: true,
    });

    expect(derived.budgetPaceStatus).toBe("at_risk");
  });

  it("returns zero usage state for empty cost reporting", () => {
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

    expect(derived.costReportingState).toBe("empty");
    expect(derived.hasAnyUsage).toBe(false);
  });

  it("omits Highest-cost project/operation KPIs when there is no attributed spend (TB-1220)", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: {
        daily: [{ bucketUtc: "2026-07-01T00:00:00Z", estimatedCostUsd: 0, promptTokens: 0, completionTokens: 0 }],
        byWorkspaceProject: [
          {
            workspaceId: "w1",
            workspaceName: "Pilot",
            projectId: "p1",
            projectName: "Current project",
            estimatedCostUsd: 0,
            promptTokens: 0,
            completionTokens: 0,
          },
        ],
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
      adminDashboard: {
        budgetAmountUsd: 75,
        usedAmountUsd: 0,
        remainingAmountUsd: 75,
        resetPeriod: "UTC month",
        hardStopEnabled: true,
        trialExpirationUtc: null,
        workspaceKind: "Trial",
        customerAiProviderConfigured: true,
        usageByFeatureUsd: { ReviewAnalysis: 0 },
        recentEvents: [],
      },
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: true,
      canManageBudget: true,
    });

    expect(derived.hasAnyUsage).toBe(false);
    expect(derived.kpi.highestCostProjectName).toBeNull();
    expect(derived.kpi.highestCostOperationName).toBeNull();
  });

  it("restricts budget sections without execute authority", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: buildMockLlmCostReportingDashboard(),
      costReportingLoading: false,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: null,
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: true,
      adminDashboard: null,
      adminLoading: false,
      adminError: false,
      adminForbidden: true,
      filters: DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
      canViewBudgetDetails: false,
      canManageBudget: false,
    });

    expect(derived.budgetState).toBe("permission_restricted");
    expect(derived.activityState).toBe("permission_restricted");
  });

  it("filters scheduled activity rows", () => {
    const derived = buildAiUsageDashboardDerived({
      costReporting: null,
      costReportingLoading: false,
      costReportingError: false,
      costReportingDelayed: false,
      budgetStatus: baseBudgetStatus(),
      budgetLoading: false,
      budgetError: false,
      budgetForbidden: false,
      adminDashboard: baseAdminDashboard({
        recentEvents: [baseEvent({ userId: null }), baseEvent({ userId: "user-2" })],
      }),
      adminLoading: false,
      adminError: false,
      adminForbidden: false,
      filters: { ...DEFAULT_AI_USAGE_DASHBOARD_FILTERS, trigger: "scheduled" },
      canViewBudgetDetails: true,
      canManageBudget: true,
    });

    expect(derived.activityRows).toHaveLength(1);
    expect(derived.activityRows[0]?.triggerBadge).toBe("Scheduled");
  });
});
