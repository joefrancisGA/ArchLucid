"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchEvolutionCandidates,
  fetchEvolutionResults,
  postEvolutionSimulate,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { parseEvolutionPlanSnapshot } from "@/lib/evolution-plan-snapshot";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import type { EvolutionCandidateChangeSetResponse, EvolutionResultsResponse } from "@/types/evolution";

import type { EvolutionReviewPageViewModel } from "./evolution-review-view-model";

export function useEvolutionReviewPage(): EvolutionReviewPageViewModel {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  const [candidates, setCandidates] = useState<EvolutionCandidateChangeSetResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EvolutionResultsResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [simulateBusy, setSimulateBusy] = useState(false);
  const [listFailure, setListFailure] = useState<ApiLoadFailureState | null>(null);
  const [detailFailure, setDetailFailure] = useState<ApiLoadFailureState | null>(null);
  const [simulateFailure, setSimulateFailure] = useState<ApiLoadFailureState | null>(null);

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

    void loadDetail(selectedId);
  }, [isDemo, selectedId, loadDetail]);

  const planSnapshot = useMemo(() => {
    if (detail === null) {
      return null;
    }

    return parseEvolutionPlanSnapshot(detail.planSnapshotJson);
  }, [detail]);

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
  };
}
