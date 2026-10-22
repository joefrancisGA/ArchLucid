import type { TenantTrialStatusClientPayload } from "@/lib/tenant-trial-status-client";

/** Trial lifecycle states where the paid Team expansion nudge never applies. */
const TRIAL_LIFECYCLE_STATUSES = new Set([
  "Active",
  "Expired",
  "ReadOnly",
  "ExportOnly",
]);

/**
 * Gates `GET /v1/tenant/usage-status` for {@link TeamExpansionNudge} until trial-status resolves
 * and indicates a paid (non-trial-lifecycle) tenant.
 */
export function shouldFetchTenantUsageStatusForTeamExpansionNudge(
  trialPayload: TenantTrialStatusClientPayload | null | undefined,
  trialFetched: boolean,
): boolean {
  if (!trialFetched) {
    return false;
  }

  const status = trialPayload?.status?.trim();

  if (status === undefined || status.length === 0 || status === "None" || status === "Converted") {
    return true;
  }

  return !TRIAL_LIFECYCLE_STATUSES.has(status);
}
