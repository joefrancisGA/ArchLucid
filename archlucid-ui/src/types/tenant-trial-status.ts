/** Subset of `GET /v1/tenant/trial-status` used by tenant settings UI. */
export type TenantTrialStatusPayload = {
  status?: string;
  daysRemaining?: number | null;
};
