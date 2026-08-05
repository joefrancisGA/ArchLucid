import { describe, expect, it } from "vitest";

import {
  canProvisionAdminTenantForm,
  resolveAdminTenantLifecycleStatus,
  type AdminTenantRecord,
} from "@/lib/admin-tenants-ops";

describe("admin-tenants-ops helpers", () => {
  it("requires name and email with @ for create", () => {
    expect(canProvisionAdminTenantForm("", "a@b.com")).toBe(false);
    expect(canProvisionAdminTenantForm("Acme", "")).toBe(false);
    expect(canProvisionAdminTenantForm("Acme", "not-an-email")).toBe(false);
    expect(canProvisionAdminTenantForm("Acme", "ops@acme.example")).toBe(true);
  });

  it("resolves lifecycle status from offboard and suspend timestamps", () => {
    const base: AdminTenantRecord = {
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      name: "Acme",
      slug: "acme",
      tier: "Standard",
    };

    expect(resolveAdminTenantLifecycleStatus(base)).toBe("active");
    expect(resolveAdminTenantLifecycleStatus({ ...base, suspendedUtc: "2026-08-01T00:00:00Z" })).toBe(
      "suspended",
    );
    expect(
      resolveAdminTenantLifecycleStatus({
        ...base,
        suspendedUtc: "2026-08-01T00:00:00Z",
        offboardedUtc: "2026-08-02T00:00:00Z",
      }),
    ).toBe("erasure-quarantine");
  });
});
