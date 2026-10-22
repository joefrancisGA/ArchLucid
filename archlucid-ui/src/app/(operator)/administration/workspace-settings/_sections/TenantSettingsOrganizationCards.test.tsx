import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";
import { TenantSettingsOrganizationCards } from "./TenantSettingsOrganizationCards";

vi.mock("./TenantWorkspaceProjectsCard", () => ({
  TenantWorkspaceProjectsCard: () => <div data-testid="tenant-workspace-projects-card" />,
}));

function buildModel(): TenantSettingsPageContentModel {
  return {
    currentPrincipalName: "Test User",
    tenantDisplayName: "Acme Architecture",
    callerAuthorityRank: 3,
    isTenantAdmin: true,
    trial: {
      status: "Active",
      daysRemaining: 14,
    },
  };
}

describe("TenantSettingsOrganizationCards", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hides pilot and trial fields for in-tenant SecureNow", () => {
    vi.stubEnv("NEXT_PUBLIC_SECURENOW_HOSTING", "in-tenant");

    render(
      <TenantSettingsOrganizationCards
        tenantDisplayName="Acme Architecture"
        scope={{ "x-tenant-id": "tenant-1" }}
        model={buildModel()}
      />,
    );

    expect(screen.queryByText("Pilot / trial")).not.toBeInTheDocument();
    expect(screen.getByTestId("tenant-workspace-projects-card")).toBeInTheDocument();
  });

  it("keeps pilot and trial fields for hosted deployments", () => {
    render(
      <TenantSettingsOrganizationCards
        tenantDisplayName="Acme Architecture"
        scope={{ "x-tenant-id": "tenant-1" }}
        model={buildModel()}
      />,
    );

    expect(screen.getByText("Pilot / trial")).toBeInTheDocument();
  });
});
