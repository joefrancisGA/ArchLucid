"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchEvolutionCandidates,
  fetchEvolutionResults,
  postEvolutionSimulate,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { parseEvolutionPlanSnapshot } from "@/lib/evolution-plan-snapshot";
import {
  DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE,
  type ImpactPreviewBaselineOption,
  type ImpactPreviewComparisonScope,
} from "@/lib/impact-preview-page-types";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";
import { runSummaryDisplayLabel } from "@/lib/runs/run-summary-display-label";
import type { EvolutionCandidateChangeSetResponse, EvolutionResultsResponse } from "@/types/evolution";

import type { EvolutionReviewPageViewModel } from "./evolution-review-view-model";
import type { EvolutionReviewPageServerLoad } from "./load-evolution-review-page-data";

function mergeBaselineOptions(
  linkedRunIds: readonly string[],
  finalizedRuns: ReadonlyArray<{ readonly runId: string; readonly label: string }>,
): ImpactPreviewBaselineOption[] {
  const byId = new Map<string, ImpactPreviewBaselineOption>();

  for (const run of finalizedRuns) {
    byId.set(run.runId, { runId: run.runId, label: run.label });
  }

  for (const runId of linkedRunIds) {
    if (!byId.has(runId)) {
      byId.set(runId, { runId, label: runId });
    }
  }

  return Array.from(byId.values());
}

export function useEvolutionReviewPage(serverLoad: EvolutionReviewPageServerLoad): EvolutionReviewPageViewModel {
  const isDemo = serverLoad.mode === "demo";

  const [candidates, setCandidates] = useState<EvolutionCandidateChangeSetResponse[]>(
    serverLoad.mode === "live" ? serverLoad.candidates : [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    serverLoad.mode === "live" ? serverLoad.selectedId : null,
  );
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [baselineRunOptions, setBaselineRunOptions] = useState<ReadonlyArray<{ readonly runId: string; readonly label: string }>>(
    [],
  );
  const [comparisonScope, setComparisonScope] = useState<ImpactPreviewComparisonScope>(
    DEFAULT_IMPACT_PREVIEW_COMPARISON_SCOPE,
  );
  const [detail, setDetail] = useState<EvolutionResultsResponse | null>(
    serverLoad.mode === "live" ? serverLoad.detail : null,
  );
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [simulateBusy, setSimulateBusy] = useState(false);
  const [listFailure, setListFailure] = useState<ApiLoadFailureState | null>(
    serverLoad.mode === "live" ? serverLoad.listFailure : null,
  );
  const [detailFailure, setDetailFailure] = useState<ApiLoadFailureState | null>(
    serverLoad.mode === "live" ? serverLoad.detailFailure : null,
  );
  const [simulateFailure, setSimulateFailure] = useState<ApiLoadFailureState | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(
    serverLoad.mode === "live" && serverLoad.listFailure === null ? new Date() : null,
  );

  const skipInitialClientListFetchRef = useRef(serverLoad.mode === "live");
  const skipInitialDetailFetchRef = useRef(
    serverLoad.mode === "live" &&
      serverLoad.selectedId !== null &&
      serverLoad.selectedId !== "" &&
      (serverLoad.detail !== null || serverLoad.detailFailure !== null),
  );

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListFailure(null);

    try {
      const body = await fetchEvolutionCandidates(100);
      const rows = body.candidates ?? [];

      setCandidates(rows);
      setSelectedId((prev) => {
        if (prev !== null && rows.some((c) => c.candidateChangeSetId === prev)) {
          return prev;
        }

        return rows.length > 0 ? rows[0].candidateChangeSetId : null;
      });
      setLastRefreshedAt(new Date());
    } catch (e) {
      setListFailure(toApiLoadFailure(e));
      setCandidates([]);
      setSelectedId(null);
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (candidateId: string) => {
    setDetailLoading(true);
    setDetailFailure(null);

    try {
      const res = await fetchEvolutionResults(candidateId);

      setDetail(res);
    } catch (e) {
      setDetailFailure(toApiLoadFailure(e));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    let canceled = false;

    void loadProjectRunsMergedWithDemoFallback("default", { forCompare: true, committedOnly: true })
      .then((merged) => {
        if (canceled) {
          return;
        }

        setBaselineRunOptions(
          merged.items.map((item) => ({
            runId: item.runId,
            label: runSummaryDisplayLabel(item),
          })),
        );
      })
      .catch(() => {
        if (canceled) {
          return;
        }

        setBaselineRunOptions([]);
      });

    return () => {
      canceled = true;
    };
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    if (skipInitialClientListFetchRef.current) {
      skipInitialClientListFetchRef.current = false;

      return;
    }

    void loadList();
  }, [isDemo, loadList]);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    if (selectedId === null || selectedId === "") {
      setDetail(null);

      return;
    }

    if (skipInitialDetailFetchRef.current) {
      skipInitialDetailFetchRef.current = false;

      return;
    }

    void loadDetail(selectedId);
  }, [isDemo, selectedId, loadDetail]);

  const planSnapshot = useMemo(() => {
    if (detail === null) {
      return null;
    }

    return parseEvolutionPlanSnapshot(detail.planSnapshotJson);
  }, [detail]);

  const baselineOptions = useMemo(
    () => mergeBaselineOptions(planSnapshot?.linkedArchitectureRunIds ?? [], baselineRunOptions),
    [baselineRunOptions, planSnapshot?.linkedArchitectureRunIds],
  );

  useEffect(() => {
    if (baselineOptions.length === 0) {
      setSelectedBaselineId(null);

      return;
    }

    setSelectedBaselineId((prev) => {
      if (prev !== null && baselineOptions.some((option) => option.runId === prev)) {
        return prev;
      }

      return baselineOptions[0]?.runId ?? null;
    });
  }, [baselineOptions]);

  const toggleComparisonScope = useCallback((key: keyof ImpactPreviewComparisonScope) => {
    setComparisonScope((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const onSimulate = useCallback(async () => {
    if (selectedId === null || selectedId === "") {
      return;
    }

    setSimulateBusy(true);
    setSimulateFailure(null);

    try {
      await postEvolutionSimulate(selectedId);
      await loadDetail(selectedId);
      await loadList();
    } catch (e) {
      setSimulateFailure(toApiLoadFailure(e));
    } finally {
      setSimulateBusy(false);
    }
  }, [selectedId, loadDetail, loadList]);

  return {
    isDemo,
    candidates,
    selectedId,
    setSelectedId,
    selectedBaselineId,
    setSelectedBaselineId,
    baselineOptions,
    comparisonScope,
    toggleComparisonScope,
    detail,
    listLoading,
    detailLoading,
    simulateBusy,
    listFailure,
    detailFailure,
    simulateFailure,
    loadList,
    onSimulate,
    planSnapshot,
    lastRefreshedAt,
  };
}
