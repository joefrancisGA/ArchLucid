import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const showError = vi.fn();
const showInfo = vi.fn();
const showSuccess = vi.fn();

const startMarketingPlanBillingCheckout = vi.hoisted(() => vi.fn().mockResolvedValue({ outcome: "redirected" }));

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

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => ({ data: null }),
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
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

vi.mock("@/lib/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Pilot workspace",
    projectLabel: "Default",
  }),
}));

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...mod,
    fetchLlmMonthlyDollarBudgetStatusCached: vi.fn(async () => ({
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
    })),
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

describe("BillingSettingsPage", () => {
  beforeEach(() => {
    showError.mockClear();
    showInfo.mockClear();
    showSuccess.mockClear();
    startMarketingPlanBillingCheckout.mockClear();
  });

  it("loads canonical tiers, shows subscription management layout, and hides Stripe ids", async () => {
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

    render(<OperatorBillingSettingsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("billing-tier-architect")).toBeInTheDocument();
    });

    expect(screen.getByTestId("billing-tier-team")).toBeInTheDocument();
    expect(screen.getByTestId("billing-tier-enterprise")).toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-current-plan")).toBeInTheDocument();
    expect(screen.getByText(/does not have an active paid plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage your plan, AI usage credits/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /View public pricing/i })[0]).toHaveAttribute("href", "/pricing");
    expect(screen.getByTestId("operator-billing-usage-section")).toBeInTheDocument();
    expect(screen.getByText("Monthly AI budget allowance")).toBeInTheDocument();
    expect(screen.getByText("$100 / month")).toBeInTheDocument();
    const architectCard = screen.getByTestId("billing-tier-architect");
    expect(within(architectCard).getByText("Included AI credits")).toBeInTheDocument();
    expect(within(architectCard).getByText("500 AI credits / month")).toBeInTheDocument();
    expect(within(architectCard).getByText(/Effective Jul 9, 2026/i)).toBeInTheDocument();
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

    fireEvent.click(within(architectCard).getByRole("button", { name: /Start Architect plan/i }));

    await waitFor(() => {
      expect(startMarketingPlanBillingCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ planId: "architect", seats: 1, workspaces: 1 }),
      );
    });

    vi.unstubAllGlobals();
  });

  it("shows durable checkout success callout when returning from Stripe", async () => {
    const navigation = await import("next/navigation");
    vi.spyOn(navigation, "useSearchParams").mockReturnValue(new URLSearchParams("checkout=success") as never);

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
