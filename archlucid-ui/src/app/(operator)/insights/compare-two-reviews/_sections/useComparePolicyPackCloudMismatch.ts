"use client";

import { useMemo } from "react";

import type { CompareManifestGovernanceSnapshot } from "@/lib/compare-effective-governance-diff";
import { useArchitectureRequestQuery } from "@/hooks/use-architecture-request-query";
import { evaluatePolicyPackCloudMismatchForReview } from "@/lib/review-quality/policy-pack-cloud-mismatch-for-review";

export type ComparePolicyPackCloudMismatchState = {
  readonly baselineDetail: string | null;
  readonly targetDetail: string | null;
};

function evaluateManifestCloudMismatch(
  request: Awaited<ReturnType<typeof import("@/lib/api").getArchitectureRequest>> | null | undefined,
  manifest: CompareManifestGovernanceSnapshot | null | undefined,
): string | null {
  if (request === null || request === undefined || manifest === null || manifest === undefined) {
    return null;
  }

  const ruleSetId = manifest.ruleSetId ?? "";

  return evaluatePolicyPackCloudMismatchForReview(
    request.cloudProvider,
    ruleSetId,
    manifest.ruleSetVersion,
    request.policyReferences,
    manifest.atCommit?.packAssignments,
  );
}

/** TB-2322 — per-side policy-pack ↔ cloud-target mismatch on compare governance panel. */
export function useComparePolicyPackCloudMismatch(
  baselineRequestId: string | null | undefined,
  targetRequestId: string | null | undefined,
  baselineManifest: CompareManifestGovernanceSnapshot | null | undefined,
  targetManifest: CompareManifestGovernanceSnapshot | null | undefined,
): ComparePolicyPackCloudMismatchState {
  const baselineReq = baselineRequestId?.trim() ?? "";
  const targetReq = targetRequestId?.trim() ?? "";
  const manifestsReady =
    baselineManifest !== null &&
    baselineManifest !== undefined &&
    targetManifest !== null &&
    targetManifest !== undefined;
  const baselineRequestQuery = useArchitectureRequestQuery(baselineReq, {
    enabled: manifestsReady && baselineReq.length > 0,
  });
  const targetRequestQuery = useArchitectureRequestQuery(targetReq, {
    enabled: manifestsReady && targetReq.length > 0,
  });

  return useMemo(() => {
    if (!manifestsReady) {
      return { baselineDetail: null, targetDetail: null };
    }

    if (baselineReq.length === 0 && targetReq.length === 0) {
      return { baselineDetail: null, targetDetail: null };
    }

    return {
      baselineDetail: evaluateManifestCloudMismatch(baselineRequestQuery.data, baselineManifest),
      targetDetail: evaluateManifestCloudMismatch(targetRequestQuery.data, targetManifest),
    };
  }, [
    baselineManifest,
    baselineReq.length,
    baselineRequestQuery.data,
    manifestsReady,
    targetManifest,
    targetReq.length,
    targetRequestQuery.data,
  ]);
}
