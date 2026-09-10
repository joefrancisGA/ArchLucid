import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";
import type {
  ComplianceDriftTrendPoint,
  GovernanceDashboardSummary,
} from "@/types/governance-dashboard";
import type { EffectivePolicyPackSet } from "@/types/policy-packs";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import {
  complianceDriftTrendBlockedReason,
  governanceDashboardBlockedReason,
} from "@/lib/governance/governance-dashboard-blocked-reason";
import {
  governanceResolutionBlockedReason,
  governanceSetupGuideBlockedReason,
} from "@/lib/governance/governance-workflow-read-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiGet } from "./http";

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

/** Governance setup guide: effective policy packs and alert routing subscriptions. */
export async function fetchGovernanceSetupGuideBundle(): Promise<{
  effectivePolicyPacks: EffectivePolicyPackSet;
  alertRoutingSubscriptions: AlertRoutingSubscription[];
}> {
  try {
    return await apiGetSealedManifestAware(`${governanceBase()}/setup-guide-bundle`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceSetupGuideBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Fetches the governance resolution result (merge decisions, conflicts, effective content). */
export async function getGovernanceResolution(): Promise<EffectiveGovernanceResolutionResult> {
  try {
    return await apiGetSealedManifestAware<EffectiveGovernanceResolutionResult>(`/${ApiV1Routes.governanceResolution}`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceResolutionBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Cross-run governance dashboard: pending approvals, recent decisions, tenant policy change log. */
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

  try {
    return await apiGetSealedManifestAware<GovernanceDashboardSummary>(`${governanceBase()}/dashboard?${query.toString()}`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceDashboardBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Policy pack change activity buckets for the governance dashboard trend chart. */
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

  try {
    return await apiGetSealedManifestAware<ComplianceDriftTrendPoint[]>(
      `${governanceBase()}/compliance-drift-trend?${query.toString()}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = complianceDriftTrendBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
