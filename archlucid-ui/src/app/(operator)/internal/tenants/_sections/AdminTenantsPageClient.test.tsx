import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    isAuthorityLoading: false,
    callerAuthorityRank: 100,
  }),
}));

vi.mock("@/lib/admin-tenants-ops", () => ({
  canProvisionAdminTenantForm: () => false,
  listAdminTenants: vi.fn(),
  provisionAdminTenant: vi.fn(),
  resolveAdminTenantLifecycleStatus: (row: { suspendedUtc?: string | null }) =>
    row.suspendedUtc ? "suspended" : "active",
  suspendAdminTenant: vi.fn(),
  unsuspendAdminTenant: vi.fn(),
}));

vi.mock("@/lib/nav-authority", () => ({
  AUTHORITY_RANK: { AdminAuthority: 50 },
}));

import { AdminTenantsPageClient } from "./AdminTenantsPageClient";
import * as adminTenantsOps from "@/lib/admin-tenants-ops";

describe("AdminTenantsPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminTenantsOps.listAdminTenants).mockResolvedValue([
      {
        id: "tenant-1",
        name: "Contoso",
        createdUtc: "2026-01-01T00:00:00Z",
        suspendedUtc: null,
      },
    ]);
    vi.mocked(adminTenantsOps.suspendAdminTenant).mockResolvedValue(undefined);
  });

  it("confirms before shutting off a tenant instead of window.confirm", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<AdminTenantsPageClient />);

    fireEvent.click(await screen.findByTestId("admin-tenants-shut-off-tenant-1"));

    expect(screen.getByRole("heading", { name: /Shut off tenant/i })).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(adminTenantsOps.suspendAdminTenant).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Shut off tenant" }));

    await waitFor(() => {
      expect(adminTenantsOps.suspendAdminTenant).toHaveBeenCalledWith("tenant-1");
    });

    confirmSpy.mockRestore();
  });
});
