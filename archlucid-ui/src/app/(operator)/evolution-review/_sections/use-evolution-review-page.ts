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
import type { EvolutionCandidateChangeSetResponse, EvolutionResultsResponse } from "@/types/evolution";

import type { EvolutionReviewPageViewModel } from "./evolution-review-view-model";
import type { EvolutionReviewPageServerLoad } from "./load-evolution-review-page-data";

export function useEvolutionReviewPage(serverLoad: EvolutionReviewPageServerLoad): EvolutionReviewPageViewModel {
  const isDemo = serverLoad.mode === "demo";

  const [candidates, setCandidates] = useState<EvolutionCandidateChangeSetResponse[]>(
    serverLoad.mode === "live" ? serverLoad.candidates : [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    serverLoad.mode === "live" ? serverLoad.selectedId : null,
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
