"use client";

import { getAuthorityRunManifest } from "@/lib/api/architecture-runs";
import { parseManifestTransparencyTrail } from "@/lib/compare/parse-manifest-transparency-trail";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoGoldenManifestJsonForExport,
} from "@/lib/operator/operator-static-demo";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type CompareProvenanceTrailSide = {
  readonly runId: string;
  readonly trail: TransparencyTrail | null;
  readonly missingTrailDefect: boolean;
};

export type CompareProvenanceTrailsQueryResult = {
  readonly baseline: CompareProvenanceTrailSide;
  readonly target: CompareProvenanceTrailSide;
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

async function loadCompareProvenanceTrailSide(runId: string): Promise<CompareProvenanceTrailSide> {
  const trimmed = runId.trim();
  const wire = await loadManifestForCompareRun(trimmed);
  const trail = parseManifestTransparencyTrail(wire);

  return {
    runId: trimmed,
    trail,
    missingTrailDefect: wire !== null && trail === null,
  };
}

type UseCompareProvenanceTrailsQueryOptions = {
  readonly enabled?: boolean;
};

/** Loads transparency trails for both compared packages (WA-09). */
export function useCompareProvenanceTrailsQuery(
  baselineRunId: string | null,
  targetRunId: string | null,
  options?: UseCompareProvenanceTrailsQueryOptions,
) {
  const baseline = baselineRunId?.trim() ?? "";
  const target = targetRunId?.trim() ?? "";
  const sameDemoRun =
    baseline.length > 0
    && target.length > 0
    && canonicalizeDemoRunId(baseline).toLowerCase() === canonicalizeDemoRunId(target).toLowerCase();
  const enabled =
    (options?.enabled ?? true) && baseline.length > 0 && target.length > 0 && !sameDemoRun;

  return createOperatorQueryHook<CompareProvenanceTrailsQueryResult>({
    queryKey: [...operatorQueryKeys.compareGovernanceDiff(baseline, target), "provenance-trails"],
    queryFn: async () => {
      const [baselineSide, targetSide] = await Promise.all([
        loadCompareProvenanceTrailSide(baseline),
        loadCompareProvenanceTrailSide(target),
      ]);

      return {
        baseline: baselineSide,
        target: targetSide,
      };
    },
    enabled,
  });
}
