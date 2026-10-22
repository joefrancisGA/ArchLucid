import { describe, expect, it } from "vitest";

import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";
import {
  ARCHLUCID_VENDOR_STAFF_CROSS_TENANT_PERMISSION,
  isArchLucidVendorStaffPrincipal,
} from "@/lib/vendor-staff-principal";

describe("isArchLucidVendorStaffPrincipal", () => {
  it("returns false for ordinary tenant principals", () => {
    expect(isArchLucidVendorStaffPrincipal(operatorNavOutsideProviderPrincipal)).toBe(false);
  });

  it("returns true for PlatformOperator role", () => {
    expect(
      isArchLucidVendorStaffPrincipal({
        ...operatorNavOutsideProviderPrincipal,
        roleClaimValues: ["PlatformOperator"],
      }),
    ).toBe(true);
  });

  it("returns true for cross-tenant read permission", () => {
    expect(
      isArchLucidVendorStaffPrincipal({
        ...operatorNavOutsideProviderPrincipal,
        permissionClaimValues: [ARCHLUCID_VENDOR_STAFF_CROSS_TENANT_PERMISSION],
      }),
    ).toBe(true);
  });
});
