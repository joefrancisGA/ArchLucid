import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_AI_USAGE_DASHBOARD_FILTERS } from "@/lib/ai-usage-dashboard-filters";
import { buildAiUsageDashboardDerived } from "@/lib/ai-usage-dashboard-model";
import {
  AI_USAGE_SETTINGS_CLAIM_DISCIPLINE,
  AI_USAGE_SETTINGS_FOLLOW_UPS_TITLE,
} from "@/lib/ai-usage-settings-evidence-copy";
import { AI_USAGE_BILLING_ESTIMATES_HONESTY } from "@/lib/vocabulary/ai-usage-billing-vocabulary";

import { CostReportingSettingsPageView } from "./CostReportingSettingsPageView";
import type { CostReportingSettingsPageViewModel } from "./cost-reporting-settings-page-view-model";
import {
  AI_USAGE_SETTINGS_FIRST_VIEWPORT_ID,
  AI_USAGE_SETTINGS_PAGE_DESCRIPTION_BUYER,
  AI_USAGE_SETTINGS_PAGE_DESCRIPTION_OPERATOR,
  AI_USAGE_SETTINGS_SKIP_LINK_LABEL,
  AI_USAGE_SETTINGS_SKIP_TARGET_ID,
} from "./ai-usage-settings-page-copy";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/components/AiUsageBillingVocabularyRail", () => ({
  AiUsageBillingVocabularyRail: () => <div data-testid="ai-usage-billing-vocabulary-rail" />,
}));

vi.mock("@/components/ModelGovernanceAiUsageVocabularyRail", () => ({
  ModelGovernanceAiUsageVocabularyRail: () => <div data-testid="model-governance-ai-usage-vocabulary-rail" />,
}));

function buildQuietEmptyModel(): CostReportingSettingsPageViewModel {
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
    estimatesAsOfUtc: "2026-07-10T12:00:00.000Z",
    billingPeriodUtcMonth: "2026-07",
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
  };
}

describe("CostReportingSettingsPageView buyer-polished shell (ADI)", () => {
  it("renders skip link, workspace before follow-ups, buyer description, and hides contextual help", () => {
    render(<CostReportingSettingsPageView model={buildQuietEmptyModel()} />);

    expect(screen.getByRole("link", { name: AI_USAGE_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AI_USAGE_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AI_USAGE_SETTINGS_PAGE_DESCRIPTION_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AI_USAGE_SETTINGS_PAGE_DESCRIPTION_OPERATOR)).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("ai-usage-settings-claim-discipline")).toHaveTextContent(
      AI_USAGE_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("ai-usage-estimate-honesty-line")).toHaveTextContent(
      AI_USAGE_BILLING_ESTIMATES_HONESTY,
    );
    expect(screen.queryByTestId("ai-usage-billing-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("model-governance-ai-usage-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AI_USAGE_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("ai-usage-settings-primary-content");
    const firstViewport = screen.getByTestId(AI_USAGE_SETTINGS_FIRST_VIEWPORT_ID);
    const quietEmpty = screen.getByTestId("ai-usage-period-zero-state");
    const orientationBottom = screen.getByTestId("ai-usage-settings-orientation-bottom");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(quietEmpty);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
