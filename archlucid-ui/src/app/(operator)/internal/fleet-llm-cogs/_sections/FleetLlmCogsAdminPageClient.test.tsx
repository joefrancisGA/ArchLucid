import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 4,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/trial-funnel-ops", () => ({
  fetchAdminFleetLlmCogsDashboard: vi.fn().mockResolvedValue({
    utcMonth: "2026-08",
    monthlyBudgetMonitoringActive: true,
    rows: [],
    fleetEstimatedCostUsd: 0,
    fleetBudgetCapUsd: 1000,
    fleetBudgetUtilizationPercent: 0,
    tenantsOverBudgetCap: 0,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { FleetLlmCogsAdminPageClient } from "@/app/(operator)/internal/fleet-llm-cogs/_sections/FleetLlmCogsAdminPageClient";

describe("FleetLlmCogsAdminPageClient", () => {
  it("renders the claim-discipline orientation strip on the live admin page", async () => {
    render(<FleetLlmCogsAdminPageClient />);

    expect(await screen.findByTestId("fleet-llm-cogs-page")).toBeInTheDocument();
    expect(screen.queryByTestId("fleet-llm-cogs-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});
