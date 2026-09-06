import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";
import type {
  ComplianceDriftTrendPoint,
  GovernanceDashboardSummary,
} from "@/types/governance-dashboard";
import type { EffectivePolicyPackSet } from "@/types/policy-packs";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import { apiGet } from "./http";

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

/** Approval setup guide: effective policy packs and alert routing subscriptions. */
export async function fetchGovernanceSetupGuideBundle(): Promise<{
  effectivePolicyPacks: EffectivePolicyPackSet;
  alertRoutingSubscriptions: AlertRoutingSubscription[];
}> {
  return apiGet(`${governanceBase()}/setup-guide-bundle`);
}

/** Fetches the policy resolution result (merge decisions, conflicts, effective content). */
export async function getGovernanceResolution(): Promise<EffectiveGovernanceResolutionResult> {
  return apiGet<EffectiveGovernanceResolutionResult>(`/${ApiV1Routes.governanceResolution}`);
}

/** Cross-run approval dashboard: pending approvals, recent decisions, tenant policy change log. */
export async function getGovernanceDashboard(
  maxPending = 20,
  maxDecisions = 20,
  maxChanges = 20,
): Promise<GovernanceDashboardSummary> {
  const query = new URLSearchParams({
    maxPending: String(maxPending),
    maxDecisions: String(maxDecisions),
    maxChanges: String(maxChanges),
  });

  return apiGet<GovernanceDashboardSummary>(`${governanceBase()}/dashboard?${query.toString()}`);
}

/** Policy pack change activity buckets for the approval dashboard trend chart. */
export async function getComplianceDriftTrend(
  fromUtc: string,
  toUtc: string,
  bucketMinutes = 1440,
): Promise<ComplianceDriftTrendPoint[]> {
  const query = new URLSearchParams({
    fromUtc,
    toUtc,
    bucketMinutes: String(bucketMinutes),
  });

  return apiGet<ComplianceDriftTrendPoint[]>(
    `${governanceBase()}/compliance-drift-trend?${query.toString()}`,
  );
}
