import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

export type TenantSettingsPageContentModel = {
  readonly currentPrincipalName: string | null;
  /** True when the caller holds `AdminAuthority`; gates both viewing and editing tenant-scoped configuration. */
  readonly isTenantAdmin: boolean;
  readonly trial: TenantTrialStatusPayload | null;
};
