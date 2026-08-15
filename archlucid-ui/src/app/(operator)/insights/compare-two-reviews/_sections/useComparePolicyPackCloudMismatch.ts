"use client";

import { useEffect, useState } from "react";

import type { CompareManifestGovernanceSnapshot } from "@/lib/compare-effective-governance-diff";
import { getArchitectureRequest } from "@/lib/api";
import { evaluatePolicyPackCloudMismatchForReview } from "@/lib/review-quality/policy-pack-cloud-mismatch-for-review";

export type ComparePolicyPackCloudMismatchState = {
  readonly baselineDetail: string | null;
  readonly targetDetail: string | null;
};

function evaluateManifestCloudMismatch(
  request: Awaited<ReturnType<typeof getArchitectureRequest>> | null,
  manifest: CompareManifestGovernanceSnapshot | null | undefined,
): string | null {
  if (request === null || manifest === null || manifest === undefined) {
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
  const [state, setState] = useState<ComparePolicyPackCloudMismatchState>({
    baselineDetail: null,
    targetDetail: null,
  });

  useEffect(() => {
    const baselineReq = baselineRequestId?.trim() ?? "";
    const targetReq = targetRequestId?.trim() ?? "";

    if (
      baselineManifest === null ||
      baselineManifest === undefined ||
      targetManifest === null ||
      targetManifest === undefined
    ) {
      setState({ baselineDetail: null, targetDetail: null });
      return;
    }

    if (baselineReq.length === 0 && targetReq.length === 0) {
      setState({ baselineDetail: null, targetDetail: null });
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      let baselineDetail: string | null = null;
      let targetDetail: string | null = null;

      try {
        const [baselineRequest, targetRequest] = await Promise.all([
          baselineReq.length > 0 ? getArchitectureRequest(baselineReq) : null,
          targetReq.length > 0 ? getArchitectureRequest(targetReq) : null,
        ]);

        baselineDetail = evaluateManifestCloudMismatch(baselineRequest, baselineManifest);
        targetDetail = evaluateManifestCloudMismatch(targetRequest, targetManifest);
      } catch {
        // Soft fail — governance diff still renders without mismatch callouts.
      }

      if (!cancelled) {
        setState({ baselineDetail, targetDetail });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [baselineRequestId, targetRequestId, baselineManifest, targetManifest]);

  return state;
}
