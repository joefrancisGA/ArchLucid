/** Subset of `GET /v1/tenant/trial-status` used by operator trial banners and tenant settings. */
export type TenantTrialStatusPayload = {
  /** e.g. `Active`, `ReadOnly`, `ExportOnly` — see `TrialLifecycleStatus` on the API. */
  status?: string;
  /** Days until the next lifecycle boundary; for `ExportOnly`, days until hard purge. */
  daysRemaining?: number | null;
};
