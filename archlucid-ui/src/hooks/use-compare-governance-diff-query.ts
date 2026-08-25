"use client";

import { getAuthorityRunManifest } from "@/lib/api/architecture-runs";
import { getEffectivePolicyContent, getEffectivePolicyPacks } from "@/lib/api/policy-governance-api";
import {
  buildCompareEffectiveGovernanceSnapshot,
  parseCompareManifestGovernanceSnapshot,
  type CompareGovernanceDiffView,
} from "@/lib/compare-effective-governance-diff";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoGoldenManifestJsonForExport,
} from "@/lib/operator/operator-static-demo";
import { runInpOffloadTask } from "@/lib/workers/inp-offload-client";

export type CompareGovernanceDiffQueryResult = {
  readonly view: CompareGovernanceDiffView | null;
  readonly softFailureMessage: string | null;
};

async function loadManifestForCompareRun(runId: string): Promise<unknown> {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    const demoManifest = tryStaticDemoGoldenManifestJsonForExport(trimmed);

    if (demoManifest !== null) {
      return demoManifest;
    }
  }

  return getAuthorityRunManifest(trimmed);
}

async function fetchCompareGovernanceDiff(
  baselineRunId: string,
  targetRunId: string,
): Promise<CompareGovernanceDiffQueryResult> {
  const failures: string[] = [];
  let currentEffective = null;

  const [baselineWire, targetWire, effectivePacks, effectiveContent] = await Promise.all([
    loadManifestForCompareRun(baselineRunId).catch(() => {
      failures.push("baseline manifest");
      return null;
    }),
    loadManifestForCompareRun(targetRunId).catch(() => {
      failures.push("updated manifest");
      return null;
    }),
    getEffectivePolicyPacks().catch(() => {
      failures.push("current effective policy packs");
      return null;
    }),
    getEffectivePolicyContent().catch(() => {
      failures.push("current effective policy content");
      return null;
    }),
  ]);

  if (effectivePacks !== null) {
    currentEffective = buildCompareEffectiveGovernanceSnapshot(effectivePacks, effectiveContent);
  }

  const baselineManifest = parseCompareManifestGovernanceSnapshot(baselineWire);
  const targetManifest = parseCompareManifestGovernanceSnapshot(targetWire);
  const view = await runInpOffloadTask("compareGovernanceDiff", {
    baselineManifest,
    targetManifest,
    currentEffective,
  });

  return {
    view,
    softFailureMessage: failures.length > 0 ? failures.join(", ") : null,
  };
}

type UseCompareGovernanceDiffQueryOptions = {
  readonly enabled?: boolean;
};

export function useCompareGovernanceDiffQuery(
  baselineRunId: string | null,
  targetRunId: string | null,
  options?: UseCompareGovernanceDiffQueryOptions,
) {
  const baseline = baselineRunId?.trim() ?? "";
  const target = targetRunId?.trim() ?? "";
  const sameDemoRun =
    baseline.length > 0 &&
    target.length > 0 &&
    canonicalizeDemoRunId(baseline).toLowerCase() === canonicalizeDemoRunId(target).toLowerCase();
  const enabled =
    (options?.enabled ?? true) && baseline.length > 0 && target.length > 0 && !sameDemoRun;

  return createOperatorQueryHook<CompareGovernanceDiffQueryResult>({
    queryKey: operatorQueryKeys.compareGovernanceDiff(baseline, target),
    queryFn: () => fetchCompareGovernanceDiff(baseline, target),
    enabled,
  });
}
