"use client";

import { useCallback, useEffect, useState } from "react";

import { getRunExplanationSummary, listRunsByProjectPaged } from "@/lib/api";
import {
  getArchitectureDecisionRegister,
  getArchitectureRiskRegister,
} from "@/lib/api/governance-stickiness-api";
import { shouldUseGovernanceCuratedDemoSpine } from "@/lib/buyer-demo-content-gating";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  staticDemoGovernanceFindingRows,
} from "@/components/governance/findings/governance-findings-demo-rows";
import {
  dedupeGovernanceFindingRows,
  decisionRegisterRows,
  mergeShowcasePhiWhenMissing,
  riskRegisterRows,
  traceRowsForRun,
} from "@/components/governance/findings/governance-findings-row-mappers";

export type GovernanceFindingsQueryState = {
  readonly rows: GovernanceFindingQueueRow[];
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refresh: () => void;
};

export function useGovernanceFindingsQuery(): GovernanceFindingsQueryState {
  const [rows, setRows] = useState<GovernanceFindingQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadFailed(false);

      const useCuratedDemoSpine = shouldUseGovernanceCuratedDemoSpine();

      if (useCuratedDemoSpine) {
        if (!cancelled) {
          setRows(staticDemoGovernanceFindingRows());
          setLoading(false);
        }

        return;
      }

      try {
        const [riskRegister, decisionRegister] = await Promise.all([
          getArchitectureRiskRegister(),
          getArchitectureDecisionRegister(),
        ]);
        const registerRows = dedupeGovernanceFindingRows([
          ...riskRegisterRows(riskRegister.entries ?? []),
          ...decisionRegisterRows(decisionRegister.decisions ?? []),
        ]);

        if (registerRows.length > 0) {
          if (!cancelled) {
            setRows(registerRows);
            setLoading(false);
          }

          return;
        }

        const page = await listRunsByProjectPaged("default", 1, 25);
        const runItems = page.items ?? [];
        const maxRuns = Math.min(runItems.length, 12);
        const slice = runItems.slice(0, maxRuns);
        const collected: GovernanceFindingQueueRow[] = [];

        await Promise.all(
          slice.map(async (run) => {
            try {
              const summary = await getRunExplanationSummary(run.runId);
              const traces =
                summary.findingTraceConfidences ?? summary.explanation?.findingTraceConfidences ?? [];

              if (traces === null || traces.length === 0) {
                return;
              }

              collected.push(...traceRowsForRun(run, traces));
            } catch {
              /* omit runs that cannot load aggregate (permissions, draft run, etc.) */
            }
          }),
        );

        if (cancelled) {
          return;
        }

        let merged = dedupeGovernanceFindingRows(collected);

        if (merged.length === 0 && useCuratedDemoSpine) {
          merged = staticDemoGovernanceFindingRows();
        } else if (useCuratedDemoSpine) {
          merged = mergeShowcasePhiWhenMissing(merged);
        }

        setRows(merged);
      } catch {
        if (cancelled) {
          return;
        }

        setLoadFailed(true);
        setRows(useCuratedDemoSpine ? staticDemoGovernanceFindingRows() : []);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  return { rows, loading, loadFailed, refresh };
}
