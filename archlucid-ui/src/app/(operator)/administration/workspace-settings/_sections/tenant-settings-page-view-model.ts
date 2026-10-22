import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

export type TenantSettingsPageContentModel = {
  readonly currentPrincipalName: string | null;
  /** Buyer-visible organization label — same source as the scope switcher tenant footer. */
  readonly tenantDisplayName: string;
  /** Resolved from `GET /api/auth/me` claims — drives header authority metadata. */
  readonly callerAuthorityRank: number;
  /** True when the caller holds `AdminAuthority`; gates both viewing and editing tenant-scoped configuration. */
  readonly isTenantAdmin: boolean;
  readonly trial: TenantTrialStatusPayload | null;
};
