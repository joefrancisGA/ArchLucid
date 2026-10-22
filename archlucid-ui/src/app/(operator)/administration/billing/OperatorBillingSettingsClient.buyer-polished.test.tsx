import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useBillingSubscriptionStatusQuery = vi.hoisted(() => vi.fn());
const useTenantUsageStatusQuery = vi.hoisted(() => vi.fn());

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/AiUsageBillingVocabularyRail", () => ({
  AiUsageBillingVocabularyRail: () => <div data-testid="ai-usage-billing-vocabulary-rail" />,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/billing",
  });
});

vi.mock("@/hooks/use-billing-subscription-status-query", () => ({
  useBillingSubscriptionStatusQuery,
}));

vi.mock("@/hooks/use-tenant-usage-status-query", () => ({
  useTenantUsageStatusQuery,
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 3,
}));

vi.mock("@/lib/frictionless-trial-session", () => ({
  readFrictionlessTrialSessionEnabled: () => false,
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Pilot workspace",
    projectLabel: "Default",
  }),
}));

vi.mock("./OperatorBillingUsageSection", () => ({
  OperatorBillingUsageSection: () => <div data-testid="operator-billing-usage-section" />,
}));

vi.mock("./OperatorBillingWalletPanel", () => ({
  OperatorBillingWalletPanel: () => <div data-testid="operator-billing-wallet-panel" />,
}));

vi.mock("./OperatorBillingPlansClient", () => ({
  OperatorBillingPlansClient: () => <div data-testid="operator-billing-plans-client" />,
}));

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  const budgetFixture = {
    monthlyBudgetMonitoringActive: true,
    blocksAdditionalLlmExecution: false,
    utcMonth: "2026-06",
    hardCutoffUsdPerUtcMonth: 100,
    effectiveHardCapUsd: 100,
    purchasedCapBumpUsd: null,
    estimatedUsdPressure: 10,
    assumedNextCallReservationUsd: null,
    hardCapUtilizationFraction: 0.25,
    warnFraction: 0.75,
  };

  return {
    ...mod,
    fetchLlmMonthlyDollarBudgetStatus: vi.fn(async () => budgetFixture),
    fetchLlmMonthlyDollarBudgetStatusCached: vi.fn(async () => budgetFixture),
  };
});

import { OperatorBillingSettingsClient } from "./OperatorBillingSettingsClient";
import {
  OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE,
  OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE,
} from "@/lib/operator/operator-billing-settings-evidence-copy";
import {
  OPERATOR_BILLING_SETTINGS_FIRST_VIEWPORT_ID,
  OPERATOR_BILLING_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  OPERATOR_BILLING_SETTINGS_PAGE_SUBTITLE_BUYER,
  OPERATOR_BILLING_SETTINGS_PRIMARY_CONTENT_ID,
  OPERATOR_BILLING_SETTINGS_SKIP_LINK_LABEL,
  OPERATOR_BILLING_SETTINGS_SKIP_TARGET_ID,
} from "@/lib/operator/operator-billing-settings-page-copy";
import { OPERATOR_BILLING_PAGE_LEAD } from "@/lib/marketing/marketing-public-pricing";

function mockSubscriptionQuery(
  data: {
    hasSubscription: boolean;
    status?: string;
    provider?: string;
    tierCode?: string;
    isPaymentPastDue?: boolean;
  } | null,
  options?: { isPending?: boolean; isFetched?: boolean },
) {
  useBillingSubscriptionStatusQuery.mockReturnValue({
    data,
    isPending: options?.isPending ?? false,
    isFetched: options?.isFetched ?? true,
  });
}

function mockUsageQuery(
  data: {
    isTrial?: boolean;
    commercialTier?: string;
    seatsUsed?: number;
    seatsLimit?: number;
  } | null,
  options?: { isPending?: boolean; isFetched?: boolean },
) {
  useTenantUsageStatusQuery.mockReturnValue({
    data,
    isPending: options?.isPending ?? false,
    isFetched: options?.isFetched ?? true,
  });
}

describe("OperatorBillingSettingsClient buyer-polished shell (ABI)", () => {
  beforeEach(() => {
    useBillingSubscriptionStatusQuery.mockReset();
    useTenantUsageStatusQuery.mockReset();
    mockSubscriptionQuery({ hasSubscription: false, isPaymentPastDue: false });
    mockUsageQuery({ isTrial: true });
  });

  it("renders skip link, current plan before follow-ups, buyer subtitle, and hides contextual help", async () => {
    render(<OperatorBillingSettingsClient />);

    expect(screen.getByRole("link", { name: OPERATOR_BILLING_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${OPERATOR_BILLING_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(OPERATOR_BILLING_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(OPERATOR_BILLING_PAGE_LEAD)).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId(OPERATOR_BILLING_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("ai-usage-billing-vocabulary-rail")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("operator-billing-current-plan")).toBeInTheDocument();
    });

    const primaryContent = screen.getByTestId(OPERATOR_BILLING_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(OPERATOR_BILLING_SETTINGS_FIRST_VIEWPORT_ID);
    const currentPlan = screen.getByTestId("operator-billing-current-plan");
    const orientationBottom = screen.getByTestId("operator-billing-settings-orientation-bottom");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(currentPlan);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
