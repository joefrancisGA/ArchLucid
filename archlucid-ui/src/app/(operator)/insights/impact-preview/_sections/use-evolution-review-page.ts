"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
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
import {
  readFindingApplyChangePreviewQuery,
  recordFindingApplyChangePreviewCompleted,
} from "@/lib/findings/finding-apply-change-preview-gate";
import { runSummaryDisplayLabel } from "@/lib/runs/run-summary-display-label";
import {
  readImpactPreviewLastBaselinePair,
  writeImpactPreviewLastBaselinePair,
  type ImpactPreviewLastBaselinePair,
} from "@/lib/impact-preview/impact-preview-last-baseline-pair-storage";
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

export function useEvolutionReviewPage(
  serverLoad: EvolutionReviewPageServerLoad,
  scopedRunId: string,
): EvolutionReviewPageViewModel {
  const isDemo = serverLoad.mode === "demo";

  const [candidates, setCandidates] = useState<EvolutionCandidateChangeSetResponse[]>(
    serverLoad.mode === "live" ? serverLoad.candidates : [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    serverLoad.mode === "live" ? serverLoad.selectedId : null,
  );
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
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
  const [continueLastPair, setContinueLastPair] = useState<ImpactPreviewLastBaselinePair | null>(null);

  useEffect(() => {
    setContinueLastPair(readImpactPreviewLastBaselinePair());
  }, []);

  const rememberBaselinePair = useCallback((baselineRunId: string | null, candidateRunId: string | null) => {
    if (baselineRunId === null || candidateRunId === null) {
      return;
    }

    const trimmedBaseline = baselineRunId.trim();
    const trimmedCandidate = candidateRunId.trim();

    if (trimmedBaseline.length === 0 || trimmedCandidate.length === 0) {
      return;
    }

    const pair: ImpactPreviewLastBaselinePair = {
      baselineRunId: trimmedBaseline,
      candidateRunId: trimmedCandidate,
    };
    writeImpactPreviewLastBaselinePair(pair);
    setContinueLastPair(pair);
  }, []);

  const resumeContinueLastPair = useCallback((pair: ImpactPreviewLastBaselinePair) => {
    setSelectedBaselineId(pair.baselineRunId);
    setSelectedId(pair.candidateRunId);
    writeImpactPreviewLastBaselinePair(pair);
    setContinueLastPair(pair);
  }, []);

  const skipInitialClientListFetchRef = useRef(serverLoad.mode === "live");
  const skipInitialDetailFetchRef = useRef(
    serverLoad.mode === "live" &&
      serverLoad.selectedId !== null &&
      serverLoad.selectedId !== "" &&
      (serverLoad.detail !== null || serverLoad.detailFailure !== null),
  );

  const runsQuery = useAskProjectRunsQuery("default", {
    forCompare: true,
    committedOnly: true,
    enabled: !isDemo,
  });

  const baselineRunOptions = useMemo((): ReadonlyArray<{ readonly runId: string; readonly label: string }> => {
    const seededBaselineId = readFindingApplyChangePreviewQuery(
      new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
    ).baselineRunId;

    if (isDemo || runsQuery.data === undefined) {
      return seededBaselineId !== null ? [{ runId: seededBaselineId, label: seededBaselineId }] : [];
    }

    const fromRuns = runsQuery.data.items.map((item) => ({
      runId: item.runId,
      label: runSummaryDisplayLabel(item),
    }));

    if (seededBaselineId !== null && !fromRuns.some((item) => item.runId === seededBaselineId)) {
      return [...fromRuns, { runId: seededBaselineId, label: seededBaselineId }];
    }

    return fromRuns;
  }, [isDemo, runsQuery.data]);

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

    const trimmedScopedRunId = scopedRunId.trim();

    setSelectedBaselineId((prev) => {
      if (
        trimmedScopedRunId.length > 0 &&
        baselineOptions.some((option) => option.runId === trimmedScopedRunId)
      ) {
        return trimmedScopedRunId;
      }

      if (prev !== null && baselineOptions.some((option) => option.runId === prev)) {
        return prev;
      }

      const seeded = readFindingApplyChangePreviewQuery(
        new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
      ).baselineRunId;

      if (seeded !== null && baselineOptions.some((option) => option.runId === seeded)) {
        return seeded;
      }

      return null;
    });
  }, [baselineOptions, scopedRunId]);

  const toggleComparisonScope = useCallback((key: keyof ImpactPreviewComparisonScope) => {
    setComparisonScope((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const retryDetailLoad = useCallback(async () => {
    if (selectedId === null || selectedId === "") {
      return;
    }

    await loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  const onSimulate = useCallback(async () => {
    if (selectedId === null || selectedId === "") {
      return;
    }

    setSimulateBusy(true);
    setSimulateFailure(null);

    try {
      await postEvolutionSimulate(selectedId);
      const previewQuery = readFindingApplyChangePreviewQuery(
        new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
      );
      const baselineRunId = selectedBaselineId ?? previewQuery.baselineRunId;

      if (baselineRunId !== null && previewQuery.findingId !== null) {
        recordFindingApplyChangePreviewCompleted(baselineRunId, previewQuery.findingId);
      }

      rememberBaselinePair(selectedBaselineId, selectedId);
      await loadDetail(selectedId);
      await loadList();
    } catch (e) {
      setSimulateFailure(toApiLoadFailure(e));
    } finally {
      setSimulateBusy(false);
    }
  }, [selectedId, selectedBaselineId, loadDetail, loadList, rememberBaselinePair]);

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
    loadDetail: retryDetailLoad,
    onSimulate,
    planSnapshot,
    lastRefreshedAt,
    continueLastPair,
    resumeContinueLastPair,
    rememberBaselinePair,
  };
}
