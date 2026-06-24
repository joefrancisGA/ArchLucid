import { isShowSystemAdministrationNavEnabled } from "@/lib/features";

/**
 * ArchLucid staff / internal sales-ops shell — not for paying tenant administrators.
 *
 * Prefer `features.showSystemAdministrationNav` (`NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV`).
 * Legacy alias: `NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR=true`.
 *
 * Customer-facing V1 shells omit system-admin navigation (deep links still 403 without API policy).
 */
export function isArchLucidInternalOperatorShellEnv(): boolean {
  return isShowSystemAdministrationNavEnabled();
}
