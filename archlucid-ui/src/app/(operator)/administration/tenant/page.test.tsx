import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

const navAuth = vi.hoisted(() => ({
  callerAuthorityRank: 3,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Test User",
      roleClaimValues: ["Admin"],
      primaryAppRole: "Admin" as const,
      maxAuthority: "AdminAuthority" as const,
      authorityRank: navAuth.callerAuthorityRank,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      permissionClaimValues: [],
    },
    callerAuthorityRank: navAuth.callerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

vi.mock("./_sections/load-tenant-settings-page-data", () => ({
  loadTenantSettingsPageData: () =>
    Promise.resolve({
      mode: "visible" as const,
      trial: { status: "Active", daysRemaining: 7 },
    }),
}));

vi.mock("@/lib/api", () => ({
  tryGetTenantTrialStatus: vi.fn(() => Promise.resolve({ status: "Active", daysRemaining: 7 })),
}));

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/settings-admin-route-paths";

import TenantSettingsPage from "./page";

describe("TenantSettingsPage", () => {
  beforeEach(() => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    vi.stubGlobal("localStorage", {
      getItem: (key: string) =>
        key === "archlucid_operator_scope_v1"
          ? JSON.stringify({
              tenantId: "tenant-1",
              workspaceId: "workspace-1",
              projectId: "project-1",
              workspaceLabel: "Pilot",
              projectLabel: "Pilot",
            })
          : null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/v1/tenant/cost-settings")) {
          return new Response(
            JSON.stringify({
              architectHourlyRateUsd: 150,
              averageIncidentCostUsd: 25000,
              eaDiscountMultiplier: 1,
              eaDiscountPercentage: 0,
              isTenantConfigured: false,
              updatedUtc: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        if (url.includes("/v1/tenant/workspaces/recycle-bin")) {
          return new Response(JSON.stringify({ retentionDays: 30, workspaces: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.includes("/v1/tenant/workspaces")) {
          return new Response(
            JSON.stringify({
              workspaces: [
                {
                  workspaceId: "workspace-1",
                  name: "Pilot",
                  defaultProjectId: "project-1",
                  projects: [{ projectId: "project-1", name: "Pilot" }],
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response("{}", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders workspace settings for tenant administrators", async () => {
    const page = await TenantSettingsPage();

    render(page);

    expect(await screen.findByTestId("tenant-settings-page")).toBeInTheDocument();
    expect(await screen.findByTestId("tenant-settings-page-title")).toHaveTextContent("Workspace settings");
    expect(screen.queryByTestId("tenant-settings-orientation")).toBeNull(); // TB-2092
    expect(await screen.findByText("Workspace scope")).toBeInTheDocument();
    expect(await screen.findByText(/selected from the workspace switcher\./i)).toBeInTheDocument();
    expect(await screen.findByText(/Status:/i)).toBeInTheDocument();
  });

  it("delegates the executive digest schedule to the Digests hub instead of duplicating the editor", async () => {
    const page = await TenantSettingsPage();

    render(page);

    expect(await screen.findByRole("link", { name: "Open digest schedule" })).toHaveAttribute(
      "href",
      DIGESTS_SCHEDULE_TAB_PATH,
    );
    expect(screen.queryByTestId("tenant-digest-save")).not.toBeInTheDocument();
  });

  it("exposes the projects recycle bin link outside technical details (TB-1181)", async () => {
    const page = await TenantSettingsPage();

    render(page);

    const recycleLink = await screen.findByTestId("tenant-settings-recycle-bin-link");

    expect(recycleLink).toHaveAttribute("href", "/administration/tenant/recycle-bin");

    const technicalDetails = screen.getByText("Technical details — routing scope").closest("details");

    expect(technicalDetails).not.toBeNull();
    expect(technicalDetails!.contains(recycleLink)).toBe(false);
  });

  it("shows a restricted state for callers below admin rank", async () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    const page = await TenantSettingsPage();

    render(page);

    expect(await screen.findByTestId("tenant-settings-restricted")).toBeInTheDocument();
    expect(screen.queryByTestId("tenant-settings-page")).not.toBeInTheDocument();
  });
});
