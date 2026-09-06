import { describe, expect, it } from "vitest";

import { validateTenantBrandingAdminFields } from "@/lib/tenant-branding-admin-validation";

describe("validateTenantBrandingAdminFields", () => {
  it("disables activation until required fields pass (TB-2005)", () => {
    const result = validateTenantBrandingAdminFields({
      companyDisplayName: "",
      primaryColor: "#0f766e",
      backgroundColor: "#fafafa",
      foregroundColor: "#171717",
      logoPrimaryAssetId: null,
      serverIssues: [],
    });

    expect(result.valid).toBe(false);
    expect(result.activateReadinessMessage).toContain("Company display name");
  });

  it("blocks activation when contrast fails WCAG AA", () => {
    const result = validateTenantBrandingAdminFields({
      companyDisplayName: "Acme",
      primaryColor: "#0f766e",
      backgroundColor: "#ffffff",
      foregroundColor: "#fefefe",
      logoPrimaryAssetId: "11111111-1111-1111-1111-111111111111",
      serverIssues: [],
    });

    expect(result.valid).toBe(false);
    expect(result.blockingIssueCodes).toContain("poorContrast");
  });

  it("allows activation when client validation passes", () => {
    const result = validateTenantBrandingAdminFields({
      companyDisplayName: "Acme",
      primaryColor: "#0f766e",
      backgroundColor: "#fafafa",
      foregroundColor: "#171717",
      logoPrimaryAssetId: "11111111-1111-1111-1111-111111111111",
      serverIssues: [],
    });

    expect(result.valid).toBe(true);
    expect(result.activateReadinessMessage).toBeNull();
  });
});
