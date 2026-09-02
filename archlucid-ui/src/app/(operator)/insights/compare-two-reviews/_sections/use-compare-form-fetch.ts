"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { coerceGoldenManifestComparison, coerceRunComparison } from "@/lib/operator/operator-response-guards";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { compareGoldenManifestRuns, compareRuns, getRunSummary } from "@/lib/api";
import { fetchComparisonNarrativeViaAsk } from "@/lib/api/conversation-api";
import {
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoGoldenManifestComparison,
  tryStaticDemoRunComparison,
} from "@/lib/operator/operator-static-demo";
import {
  readCompareLastComparisonPair,
  writeCompareLastComparisonPair,
  type CompareLastComparisonPair,
} from "@/lib/compare/compare-last-comparison-pair-storage";
import type { ComparedPair } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { RunComparison, RunSummary } from "@/types/authority";

export function useCompareFormFetch() {
  const compareGenerationRef = useRef(0);
  const [result, setResult] = useState<RunComparison | null>(null);
  const [golden, setGolden] = useState<GoldenManifestComparison | null>(null);
  const [legacyFailure, setLegacyFailure] = useState<ApiLoadFailureState | null>(null);
  const [goldenFailure, setGoldenFailure] = useState<ApiLoadFailureState | null>(null);
  const [legacyMalformed, setLegacyMalformed] = useState<string | null>(null);
  const [goldenMalformed, setGoldenMalformed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparisonNarrative, setComparisonNarrative] = useState<string | null>(null);
  const [comparisonNarrativeLoading, setComparisonNarrativeLoading] = useState(false);
  const [lastComparedPair, setLastComparedPair] = useState<ComparedPair | null>(null);
  const [leftPickedSummary, setLeftPickedSummary] = useState<RunSummary | null>(null);
  const [rightPickedSummary, setRightPickedSummary] = useState<RunSummary | null>(null);
  const [continueLastPair, setContinueLastPair] = useState<CompareLastComparisonPair | null>(null);

  useEffect(() => {
    setContinueLastPair(readCompareLastComparisonPair());
  }, []);

  const hydratePickedSummariesForPair = useCallback(async (leftAtStart: string, rightAtStart: string) => {
    const [leftSummary, rightSummary] = await Promise.all([
      getRunSummary(leftAtStart).catch(() => null),
      getRunSummary(rightAtStart).catch(() => null),
    ]);

    if (leftSummary !== null) {
      setLeftPickedSummary(leftSummary);
    }

    if (rightSummary !== null) {
      setRightPickedSummary(rightSummary);
    }
  }, []);

  const loadComparisonNarrative = async (leftAtStart: string, rightAtStart: string, compareGen: number) => {
    setComparisonNarrativeLoading(true);

    try {
      const narrative = await fetchComparisonNarrativeViaAsk(leftAtStart, rightAtStart);

      if (compareGen !== compareGenerationRef.current) {
        return;
      }

      setComparisonNarrative(narrative);
    } catch {
      if (compareGen !== compareGenerationRef.current) {
        return;
      }

      setComparisonNarrative(null);
    } finally {
      if (compareGen === compareGenerationRef.current) {
        setComparisonNarrativeLoading(false);
      }
    }
  };

  const resetComparisonOutputs = useCallback(() => {
    setLegacyFailure(null);
    setGoldenFailure(null);
    setLegacyMalformed(null);
    setGoldenMalformed(null);
    setResult(null);
    setGolden(null);
    setComparisonNarrative(null);
    setComparisonNarrativeLoading(false);
    setLastComparedPair(null);
  }, []);

  const runCompareForPair = useCallback(
    async (leftAtStart: string, rightAtStart: string, onCompareStart?: () => void) => {
      const gen = ++compareGenerationRef.current;

      setLoading(true);
      resetComparisonOutputs();
      onCompareStart?.();

      const staticLegacy = tryStaticDemoRunComparison(leftAtStart, rightAtStart);
      const staticGolden = tryStaticDemoGoldenManifestComparison(leftAtStart, rightAtStart);

      if (staticLegacy !== null && staticGolden !== null) {
        if (gen !== compareGenerationRef.current) {
          return;
        }

        setResult(staticLegacy);
        setGolden(staticGolden);
        setLoading(false);
        setLastComparedPair({ left: leftAtStart, right: rightAtStart });
        void hydratePickedSummariesForPair(leftAtStart, rightAtStart);

        return;
      }

      try {
        const [legacyOutcome, structuredOutcome] = await Promise.allSettled([
          compareRuns(leftAtStart, rightAtStart),
          compareGoldenManifestRuns(leftAtStart, rightAtStart),
        ]);

        if (gen !== compareGenerationRef.current) {
          return;
        }

        if (legacyOutcome.status === "fulfilled") {
          const coercedLegacy = coerceRunComparison(legacyOutcome.value);

          if (!coercedLegacy.ok) {
            setResult(null);
            setLegacyMalformed(coercedLegacy.message);
          } else {
            setResult(coercedLegacy.value);
          }
        } else {
          setLegacyFailure(toApiLoadFailure(legacyOutcome.reason));
          setResult(null);
        }

        if (structuredOutcome.status === "fulfilled") {
          const coercedGolden = coerceGoldenManifestComparison(structuredOutcome.value);

          if (!coercedGolden.ok) {
            setGolden(null);
            setGoldenMalformed(coercedGolden.message);
          } else {
            setGolden(coercedGolden.value);
          }
        } else {
          setGoldenFailure(toApiLoadFailure(structuredOutcome.reason));
          setGolden(null);
        }
      } finally {
        if (gen === compareGenerationRef.current) {
          setLoading(false);
          setLastComparedPair({ left: leftAtStart, right: rightAtStart });
          writeCompareLastComparisonPair({ priorRunId: leftAtStart, laterRunId: rightAtStart });
          setContinueLastPair({ priorRunId: leftAtStart, laterRunId: rightAtStart });
          void hydratePickedSummariesForPair(leftAtStart, rightAtStart);
          void loadComparisonNarrative(leftAtStart, rightAtStart, gen);
        }
      }
    },
    [hydratePickedSummariesForPair, resetComparisonOutputs],
  );

  return {
    result,
    golden,
    legacyFailure,
    goldenFailure,
    legacyMalformed,
    goldenMalformed,
    loading,
    comparisonNarrative,
    comparisonNarrativeLoading,
    lastComparedPair,
    leftPickedSummary,
    rightPickedSummary,
    continueLastPair,
    setLeftPickedSummary,
    setRightPickedSummary,
    runCompareForPair,
    resetComparisonOutputs,
  };
}
