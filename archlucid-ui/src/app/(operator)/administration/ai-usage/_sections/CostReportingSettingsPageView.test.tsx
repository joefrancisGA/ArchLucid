import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_AI_USAGE_DASHBOARD_FILTERS } from "@/lib/ai-usage-dashboard-filters";
import { buildAiUsageDashboardDerived } from "@/lib/ai-usage-dashboard-model";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { ROUTE_TITLES } from "@/lib/route-static-titles";
import { resolveNavLinkForPathname } from "@/lib/resolve-nav-link-for-pathname";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

import { CostReportingSettingsPageView } from "./CostReportingSettingsPageView";
import type { CostReportingSettingsPageViewModel } from "./cost-reporting-settings-page-view-model";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

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

function buildUsageModel(overrides: Partial<CostReportingSettingsPageViewModel> = {}): CostReportingSettingsPageViewModel {
  const derived = buildAiUsageDashboardDerived({
    costReporting: {
      daily: [{ bucketUtc: "2026-07-01T00:00:00Z", estimatedCostUsd: 12.5, promptTokens: 100, completionTokens: 50 }],
      byWorkspaceProject: [{ workspaceProjectId: "p1", workspaceProjectName: "Claims", estimatedCostUsd: 12.5 }],
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
      estimatedUsdPressure: 12.5,
      assumedNextCallReservationUsd: 1,
      hardCapUtilizationFraction: 12.5 / 75,
      warnFraction: 0.75,
      remainingBudgetUsd: 62.5,
    },
    budgetLoading: false,
    budgetError: false,
    budgetForbidden: false,
    adminDashboard: {
      budgetAmountUsd: 75,
      usedAmountUsd: 12.5,
      remainingAmountUsd: 62.5,
      resetPeriod: "UTC month",
      hardStopEnabled: true,
      trialExpirationUtc: null,
      workspaceKind: "Trial",
      customerAiProviderConfigured: true,
      usageByFeatureUsd: { ReviewAnalysis: 12.5 },
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
      daily: [{ bucketUtc: "2026-07-01T00:00:00Z", estimatedCostUsd: 12.5, promptTokens: 100, completionTokens: 50 }],
      byWorkspaceProject: [{ workspaceProjectId: "p1", workspaceProjectName: "Claims", estimatedCostUsd: 12.5 }],
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

describe("CostReportingSettingsPageView (TB-1216–1219)", () => {
  it("aligns page title with Administration nav and document title (TB-1216)", () => {
    expect(ROUTE_TITLES[AI_USAGE_SETTINGS_PATH]).toBe(OPERATOR_NAV_LINK_LABELS.aiUsage);
    expect(resolveNavLinkForPathname(AI_USAGE_SETTINGS_PATH)?.label).toBe(OPERATOR_NAV_LINK_LABELS.aiUsage);

    render(<CostReportingSettingsPageView model={buildQuietEmptyModel()} />);

    expect(screen.getByRole("heading", { level: 1, name: OPERATOR_NAV_LINK_LABELS.aiUsage })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: /AI usage and cost/i })).not.toBeInTheDocument();
  });

  it("exposes PageHeading icon and contextual help (TB-1218)", () => {
    render(<CostReportingSettingsPageView model={buildQuietEmptyModel()} />);

    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(pageHelpTopicForPathname(AI_USAGE_SETTINGS_PATH)?.label).toBe(
      `${OPERATOR_NAV_LINK_LABELS.aiUsage} help`,
    );
  });

  it("keeps a single edit-budget affordance in the budget controls cluster (TB-1219)", () => {
    render(<CostReportingSettingsPageView model={buildUsageModel()} />);

    expect(screen.getByTestId("ai-usage-monthly-budget-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ai-usage-budget-controls-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ai-usage-edit-monthly-budget")).toHaveAttribute(
      "href",
      "/administration/billing#billing-ai-credits",
    );
    expect(screen.queryByRole("link", { name: /^Edit budget$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Review limit behavior/i })).not.toBeInTheDocument();
  });
});
