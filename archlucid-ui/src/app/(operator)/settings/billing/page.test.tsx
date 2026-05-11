import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const showInfo = vi.fn();

vi.mock("@/lib/toast", () => ({
  showInfo: (...args: unknown[]) => showInfo(...args),
}));

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
      includedRunsPerMonth: 20,
      overageRunUsd: 10,
    },
    {
      id: "professional",
      title: "Professional",
      summary: "Established practice with governance and audit needs",
      workspaceMonthlyUsd: 899,
      maxWorkspaces: 5,
      includedArchitectSeats: 20,
      seatMonthlyUsd: 179,
      includedRunsPerMonth: 100,
      overageRunUsd: 8,
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

describe("BillingSettingsPage", () => {
  beforeEach(() => {
    showInfo.mockClear();
  });

  it("loads tiers from pricing.json and shows Stripe pending toast when upgrading to Team", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      if (String(input).includes("/pricing.json")) {
        return new Response(JSON.stringify(pricingFixture), {
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

    expect(screen.getByTestId("billing-tier-professional")).toBeInTheDocument();
    expect(screen.getByTestId("billing-tier-enterprise")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Team/i }));

    expect(showInfo).toHaveBeenCalledWith("Stripe Checkout Integration Pending");

    vi.unstubAllGlobals();
  });
});
