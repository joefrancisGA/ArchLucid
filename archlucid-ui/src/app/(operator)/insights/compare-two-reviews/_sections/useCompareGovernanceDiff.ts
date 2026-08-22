"use client";

import { useEffect, useState } from "react";

import { getAuthorityRunManifest } from "@/lib/api/architecture-runs";
import { getEffectivePolicyContent, getEffectivePolicyPacks } from "@/lib/api/policy-governance-api";
import {
  buildCompareEffectiveGovernanceSnapshot,
  parseCompareManifestGovernanceSnapshot,
  type CompareGovernanceDiffView,
} from "@/lib/compare-effective-governance-diff";
import { runInpOffloadTask } from "@/lib/workers/inp-offload-client";
import {
  tryStaticDemoGoldenManifestJsonForExport,
  isStaticDemoPayloadFallbackEnabled,
} from "@/lib/operator/operator-static-demo";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";

export type CompareGovernanceDiffLoadState = {
  readonly loading: boolean;
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

/**
 * Loads governance diff inputs for a compared pair. Failures are soft — compare results still render.
 */
export function useCompareGovernanceDiff(
  baselineRunId: string | null,
  targetRunId: string | null,
): CompareGovernanceDiffLoadState {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<CompareGovernanceDiffView | null>(null);
  const [softFailureMessage, setSoftFailureMessage] = useState<string | null>(null);

  useEffect(() => {
    const baseline = baselineRunId?.trim() ?? "";
    const target = targetRunId?.trim() ?? "";

    if (baseline.length === 0 || target.length === 0) {
      setLoading(false);
      setView(null);
      setSoftFailureMessage(null);
      return;
    }

    if (canonicalizeDemoRunId(baseline).toLowerCase() === canonicalizeDemoRunId(target).toLowerCase()) {
      setLoading(false);
      setView(null);
      setSoftFailureMessage(null);
      return;
    }

    let canceled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setSoftFailureMessage(null);

      const failures: string[] = [];
      let baselineManifestWire: unknown = null;
      let targetManifestWire: unknown = null;
      let currentEffective = null;

      try {
        const [baselineWire, targetWire, effectivePacks, effectiveContent] = await Promise.all([
          loadManifestForCompareRun(baseline).catch(() => {
            failures.push("baseline manifest");
            return null;
          }),
          loadManifestForCompareRun(target).catch(() => {
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

        baselineManifestWire = baselineWire;
        targetManifestWire = targetWire;

        if (effectivePacks !== null) {
          currentEffective = buildCompareEffectiveGovernanceSnapshot(effectivePacks, effectiveContent);
        }
      } catch {
        if (!canceled) {
          setView(null);
          setSoftFailureMessage("policy pack diff");
          setLoading(false);
        }

        return;
      }

      if (canceled) {
        return;
      }

      const baselineManifest = parseCompareManifestGovernanceSnapshot(baselineManifestWire);
      const targetManifest = parseCompareManifestGovernanceSnapshot(targetManifestWire);
      const nextView = await runInpOffloadTask("compareGovernanceDiff", {
        baselineManifest,
        targetManifest,
        currentEffective,
      });

      setView(nextView);
      setSoftFailureMessage(failures.length > 0 ? failures.join(", ") : null);
      setLoading(false);
    }

    void load();

    return () => {
      canceled = true;
    };
  }, [baselineRunId, targetRunId]);

  return { loading, view, softFailureMessage };
}
