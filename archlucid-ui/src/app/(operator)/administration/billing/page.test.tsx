import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const showError = vi.fn();
const showInfo = vi.fn();
const showSuccess = vi.fn();

const startMarketingPlanBillingCheckout = vi.hoisted(() => vi.fn().mockResolvedValue({ outcome: "redirected" }));

const useBillingSubscriptionStatusQuery = vi.hoisted(() => vi.fn());
const useTenantUsageStatusQuery = vi.hoisted(() => vi.fn());

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showError(...args),
  showInfo: (...args: unknown[]) => showInfo(...args),
  showSuccess: (...args: unknown[]) => showSuccess(...args),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/",
  };
});

vi.mock("@/lib/billing-checkout-client", () => ({
  startMarketingPlanBillingCheckout,
}));

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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
    isNextPublicDemoMode: () => false,
  };
});

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
import { BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";

const pricingFixture = {
  schemaVersion: 1,
  effectiveDate: "2026-07-09",
  currency: "USD",
  packages: [
    {
      id: "architect",
      title: "Architect",
      summary: "For one architect creating and reviewing architecture reviews.",
      planMonthlyUsd: 99,
      pricingDisplay: "monthly",
      includedUsers: 1,
      includedWorkspaces: 1,
      monthlyAiCredits: 500,
      includedReviewsPerMonth: 5,
      overageReviewUsd: 12,
    },
    {
      id: "team",
      title: "Team",
      summary: "Small architecture team with basic governance",
      planMonthlyUsd: 249,
      pricingDisplay: "monthly",
      includedUsers: 5,
      includedWorkspaces: 1,
      monthlyAiCredits: 2500,
      includedReviewsPerMonth: 20,
      overageReviewUsd: 10,
      seatMonthlyUsd: 79,
    },
    {
      id: "professional",
      title: "Professional",
      summary: "Governed architecture review practice with policy packs and audit exports",
      planMonthlyUsd: 1799,
      pricingDisplay: "monthly",
      includedUsers: 15,
      includedWorkspaces: 5,
      monthlyAiCredits: 10000,
      includedReviewsPerMonth: 100,
      overageReviewUsd: 8,
      seatMonthlyUsd: 179,
    },
    {
      id: "enterprise",
      title: "Enterprise",
      summary: "Large organization — SSO, procurement, and private deployment",
      pricingDisplay: "custom",
      annualCeilingUsd: 250000,
    },
  ],
};

const walletFixture = {
  balanceUsd: 25,
  autoReplenishEnabled: false,
  monthlyCapUsd: 0,
  refillIncrementUsd: 25,
  refillTriggerThresholdUsd: 5,
  autoRefillsThisUtcMonthCount: 0,
  hasPaymentMethod: false,
  rowVersionBase64: "dGVzdA==",
};

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

function stubFetch() {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input);

    if (url.includes("/pricing.json")) {
      return new Response(JSON.stringify(pricingFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.includes("/api/proxy/v1/billing/wallet")) {
      return new Response(JSON.stringify(walletFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
}

describe("BillingSettingsPage", () => {
  beforeEach(() => {
    showError.mockClear();
    showInfo.mockClear();
    showSuccess.mockClear();
    startMarketingPlanBillingCheckout.mockClear();
    useBillingSubscriptionStatusQuery.mockReset();
    useTenantUsageStatusQuery.mockReset();
    mockSubscriptionQuery({ hasSubscription: false, isPaymentPastDue: false });
    mockUsageQuery({ isTrial: true });
  });

  it("loads canonical tiers, shows subscription management layout, and hides Stripe ids", async () => {
    stubFetch();

    render(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("billing-tier-architect")).toBeInTheDocument();
    });

    expect(screen.getByTestId("billing-tier-team")).toBeInTheDocument();
    expect(screen.getByTestId("billing-tier-enterprise")).toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-current-plan")).toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-settings-claim-discipline")).toHaveTextContent(
      /not invoice-accurate financial reporting/i,
    );
    expect(screen.getByText(/does not have an active paid plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage your plan, AI usage credits/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /View public pricing/i })[0]).toHaveAttribute("href", "/pricing");
    expect(screen.getByTestId("operator-billing-usage-section")).toBeInTheDocument();
    expect(screen.getByText("Workspace AI spend cap")).toBeInTheDocument();
    expect(screen.getByText("$100 / month")).toBeInTheDocument();
    expect(screen.queryByText("Monthly AI budget allowance")).not.toBeInTheDocument();
    const architectCard = screen.getByTestId("billing-tier-architect");
    expect(within(architectCard).getByText("Included AI credits")).toBeInTheDocument();
    expect(within(architectCard).getByText("500 AI credits / month")).toBeInTheDocument();
    const teamCard = screen.getByTestId("billing-tier-team");
    expect(within(teamCard).getByText(/Recommended/i)).toBeInTheDocument();
    const currentPlan = screen.getByTestId("operator-billing-current-plan");
    expect(within(currentPlan).getByRole("link", { name: /Start Architect plan/i })).toHaveAttribute(
      "href",
      "#billing-plans",
    );
    expect(within(currentPlan).getByRole("link", { name: /Compare available plans/i })).toHaveAttribute(
      "href",
      "#billing-plans",
    );
    expect(within(currentPlan).queryByRole("button", { name: /Start Architect plan/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Start Architect plan/i })).toHaveLength(1);
    expect(
      within(screen.getByTestId("operator-billing-current-plan")).queryByText("Included AI credits"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-payment-method")).toBeInTheDocument();
    expect(screen.getByTestId("billing-tier-price-enterprise")).toHaveTextContent("Custom");
    expect(screen.queryByText(/Workspace platform/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Starting at \$60,000/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Stripe customer id/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Advanced billing details/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-invoices-and-receipts-action")).toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-subscription-status")).toHaveTextContent("No active subscription");

    fireEvent.click(within(architectCard).getByRole("button", { name: /Start Architect plan/i }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    expect(startMarketingPlanBillingCheckout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Confirm and continue to checkout/i }));

    await waitFor(() => {
      expect(startMarketingPlanBillingCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ planId: "architect", seats: 1, workspaces: 1 }),
      );
    });

    vi.unstubAllGlobals();
  });

  it("shows paid plan state with active status and manage billing", async () => {
    mockSubscriptionQuery({
      hasSubscription: true,
      status: "active",
      provider: "stripe",
      isPaymentPastDue: false,
    });
    mockUsageQuery({
      isTrial: false,
      commercialTier: "Team",
      seatsUsed: 3,
      seatsLimit: 5,
    });
    stubFetch();

    render(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByText("Team")).toBeInTheDocument();
    });

    const currentPlan = screen.getByTestId("operator-billing-current-plan");
    expect(within(currentPlan).getByTestId("operator-billing-subscription-status")).toHaveTextContent(
      "Active subscription",
    );
    await waitFor(() => {
      expect(screen.getByText("Monthly AI budget allowance")).toBeInTheDocument();
    });
    expect(screen.getByText("3 of 5 in use")).toBeInTheDocument();
    expect(within(currentPlan).getByTestId("operator-billing-manage-billing")).toBeInTheDocument();
    expect(screen.getByTestId("billing-plans-collapsible")).not.toHaveAttribute("open");

    vi.unstubAllGlobals();
  });

  it("shows checking headline while subscription data is pending", async () => {
    mockSubscriptionQuery(null, { isPending: true, isFetched: false });
    mockUsageQuery(null, { isPending: true, isFetched: false });
    stubFetch();

    render(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByText("Checking…")).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-billing-subscription-status")).toHaveTextContent("Checking subscription");

    vi.unstubAllGlobals();
  });

  it("expands available plans after subscription state resolves without a paid plan", async () => {
    mockSubscriptionQuery(null, { isPending: true, isFetched: false });
    mockUsageQuery(null, { isPending: true, isFetched: false });
    stubFetch();

    const { rerender } = render(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("billing-plans-collapsible")).toBeInTheDocument();
    });
    expect(screen.getByTestId("billing-plans-collapsible")).not.toHaveAttribute("open");

    mockSubscriptionQuery({ hasSubscription: false, isPaymentPastDue: false });
    mockUsageQuery({ isTrial: true });
    rerender(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("billing-plans-collapsible")).toHaveAttribute("open");
    });

    vi.unstubAllGlobals();
  });

  it("shows unavailable headline when subscription payloads cannot be loaded", async () => {
    mockSubscriptionQuery(null, { isPending: false, isFetched: true });
    mockUsageQuery(null, { isPending: false, isFetched: true });
    stubFetch();

    render(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByText("Unavailable")).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-billing-subscription-status")).toHaveTextContent(
      "Subscription status unavailable",
    );

    vi.unstubAllGlobals();
  });

  it("routes sales-led professional CTA to public pricing quote request", async () => {
    stubFetch();

    render(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("billing-tier-professional")).toBeInTheDocument();
    });

    const professionalCard = screen.getByTestId("billing-tier-professional");
    const quoteLink = within(professionalCard).getByRole("link", { name: /Request guided trial/i });
    expect(quoteLink).toHaveAttribute("href", expect.stringContaining("/pricing"));
    expect(quoteLink).toHaveAttribute("href", expect.stringContaining("#pricing-quote-request"));

    vi.unstubAllGlobals();
  });

  it("shows durable checkout success callout when returning from Stripe", async () => {
    const navigation = await import("next/navigation");
    vi.spyOn(navigation, "useSearchParams").mockReturnValue(new URLSearchParams("checkout=success") as never);
    stubFetch();

    render(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("billing-checkout-success-callout")).toHaveTextContent(
        BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE,
      );
    });

    expect(showSuccess).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
    vi.mocked(navigation.useSearchParams).mockRestore();
  });
});
