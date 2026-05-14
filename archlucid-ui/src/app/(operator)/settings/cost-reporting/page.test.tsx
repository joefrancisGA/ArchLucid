import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  callerAuthorityRank: 3,
  isAuthorityLoading: false,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Admin User",
      roleClaimValues: ["Admin"],
      primaryAppRole: "Admin" as const,
      maxAuthority: "AdminAuthority" as const,
      authorityRank: nav.callerAuthorityRank,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      permissionClaimValues: [],
    },
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: nav.isAuthorityLoading,
  }),
}));

const hoistedCostReportingLoad = vi.hoisted(() => ({ demo: false }));

vi.mock("./_sections/load-cost-reporting-settings-page-data", () => ({
  loadCostReportingSettingsPageData: () => Promise.resolve(hoistedCostReportingLoad),
}));

import CostReportingSettingsPage from "./page";

describe("CostReportingSettingsPage", () => {
  it("blocks non-admins", async () => {
    nav.callerAuthorityRank = 2;

    const page = await CostReportingSettingsPage();

    render(page);
    expect(screen.getByTestId("cost-reporting-forbidden")).toBeInTheDocument();
    nav.callerAuthorityRank = 3;
  });

  it("shows mock banner when API returns 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 404 })));

    const page = await CostReportingSettingsPage();

    render(page);
    expect(await screen.findByTestId("cost-reporting-mock-banner")).toBeInTheDocument();
    expect((await screen.findAllByText("Core workspace")).length).toBe(2);
    vi.unstubAllGlobals();
  });
});
