import type { CurrentPrincipal } from "@/lib/current-principal";

/** Platform permission for cross-tenant internal operations (`ArchLucidPlatformPermissionClaims.CrossTenantRead`). */
export const ARCHLUCID_VENDOR_STAFF_CROSS_TENANT_PERMISSION = "platform:cross-tenant-read" as const;

const ROLE_PLATFORM_OPERATOR = "platformoperator";

/**
 * True when the signed-in principal is ArchLucid vendor staff (platform operator role or cross-tenant read).
 * Gates Internal nav — customer tenant admins must not see vendor diagnostics or COGS surfaces.
 */
export function isArchLucidVendorStaffPrincipal(principal: CurrentPrincipal): boolean {
  if (
    principal.roleClaimValues.some((role) => role.trim().toLowerCase() === ROLE_PLATFORM_OPERATOR)
  ) {
    return true;
  }

  return principal.permissionClaimValues.includes(ARCHLUCID_VENDOR_STAFF_CROSS_TENANT_PERMISSION);
}
