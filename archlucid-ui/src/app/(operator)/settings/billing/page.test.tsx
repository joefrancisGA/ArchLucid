import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const showError = vi.fn();
const showInfo = vi.fn();

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showError(...args),
  showInfo: (...args: unknown[]) => showInfo(...args),
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => ({ data: null }),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
}));

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

import BillingSettingsPage from "./page";

const pricingFixture = {
  schemaVersion: 1,
  effectiveDate: "2026-04-17",
  currency: "USD",
  packages: [
    {
      id: "team",
      title: "Team",
      summary: "Small architecture team exploring AI-assisted review",
      workspaceMonthlyUsd: 199,
      includedArchitectSeats: 5,
      seatMonthlyUsd: 79,
      includedReviewsPerMonth: 20,
      overageReviewUsd: 10,
    },
    {
      id: "professional",
      title: "Professional",
      summary: "Established practice with governance and audit needs",
      workspaceMonthlyUsd: 899,
      maxWorkspaces: 5,
      includedArchitectSeats: 20,
      seatMonthlyUsd: 179,
      includedReviewsPerMonth: 100,
      overageReviewUsd: 8,
    },
    {
      id: "enterprise",
      title: "Enterprise",
      summary: "Large organization — annual contract",
      annualFloorUsd: 60000,
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
  });

  it("loads tiers from pricing.json, shows current plan summary, and hides Stripe ids by default", async () => {
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

    render(<BillingSettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("billing-tier-team")).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-billing-current-plan")).toBeInTheDocument();
    expect(screen.getByText(/does not have an active paid plan/i)).toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-usage-section")).toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-payment-method")).toBeInTheDocument();
    const stripeCustomerField = screen.queryByLabelText(/Stripe customer id/i);
    expect(stripeCustomerField).toBeInTheDocument();
    expect(stripeCustomerField).not.toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Team/i }));

    expect(showInfo).toHaveBeenCalledWith("Stripe Checkout Integration Pending");

    vi.unstubAllGlobals();
  });

  it("reveals Stripe ids inside advanced billing details", async () => {
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

    render(<BillingSettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("operator-billing-advanced-details")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Advanced billing details"));

    expect(await screen.findByLabelText(/Stripe customer id/i)).toBeInTheDocument();
    expect(screen.queryByText(/Typical land range/i)).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
