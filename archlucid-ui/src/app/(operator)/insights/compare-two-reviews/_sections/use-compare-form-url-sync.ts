"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  comparePageHrefAdaptive,
  compareRunIdsAreSameAfterDemoCanonicalization,
  readCompareRunIdsFromSearchParams,
} from "@/lib/compare-url-query-params";

export function useCompareFormUrlSync(options: {
  setLeftRunId: (runId: string) => void;
  setRightRunId: (runId: string) => void;
  runCompareForPair: (left: string, right: string) => Promise<void>;
}): { syncSelectionToUrl: (priorRunId: string, laterRunId: string) => void } {
  const { setLeftRunId, setRightRunId, runCompareForPair } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastAutoComparedPairKeyRef = useRef("");

  const syncSelectionToUrl = useCallback(
    (priorRunId: string, laterRunId: string) => {
      router.replace(comparePageHrefAdaptive(priorRunId, laterRunId), { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    const { prior: left, later: right } = readCompareRunIdsFromSearchParams(searchParams);
    if (left.length > 0) setLeftRunId(left);
    if (right.length > 0) setRightRunId(right);
  }, [searchParams, setLeftRunId, setRightRunId]);

  useEffect(() => {
    const { prior: left, later: right } = readCompareRunIdsFromSearchParams(searchParams);
    if (left.length === 0 || right.length === 0) {
      lastAutoComparedPairKeyRef.current = "";
      return;
    }

    const pairKey = `${left}\u0000${right}`;
    if (lastAutoComparedPairKeyRef.current === pairKey) {
      return;
    }

    lastAutoComparedPairKeyRef.current = pairKey;
    if (compareRunIdsAreSameAfterDemoCanonicalization(left, right)) return;
    void runCompareForPair(left, right);
  }, [searchParams, runCompareForPair]);

  return { syncSelectionToUrl };
}
