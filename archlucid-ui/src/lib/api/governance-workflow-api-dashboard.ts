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
