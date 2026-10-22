"use client";

import { useRef, useState } from "react";

import { coerceComparisonExplanation } from "@/lib/operator/operator-response-guards";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { explainComparisonRuns } from "@/lib/api";
import type { ComparisonExplanation } from "@/types/explanation";

export function useCompareFormAiExplanation() {
  const aiGenerationRef = useRef(0);
  const [aiExplanation, setAiExplanation] = useState<ComparisonExplanation | null>(null);
  const [aiFailure, setAiFailure] = useState<ApiLoadFailureState | null>(null);
  const [aiMalformed, setAiMalformed] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const resetAiExplanation = () => {
    setAiExplanation(null);
    setAiFailure(null);
    setAiMalformed(null);
  };

  const loadAiExplanation = async (
    leftTrim: string,
    rightTrim: string,
    sameCanonicalRunIdsBlocked: boolean,
  ) => {
    if (!leftTrim || !rightTrim) {
      return;
    }

    if (sameCanonicalRunIdsBlocked) {
      return;
    }

    const leftAtStart = leftTrim;
    const rightAtStart = rightTrim;
    const gen = ++aiGenerationRef.current;

    setAiLoading(true);
    setAiFailure(null);
    setAiExplanation(null);
    setAiMalformed(null);

    try {
      const ex: unknown = await explainComparisonRuns(leftAtStart, rightAtStart);

      if (gen !== aiGenerationRef.current) {
        return;
      }

      const coerced = coerceComparisonExplanation(ex);

      if (!coerced.ok) {
        setAiExplanation(null);
        setAiMalformed(coerced.message);
      } else {
        setAiExplanation(coerced.value);
      }
    } catch (err) {
      if (gen !== aiGenerationRef.current) {
        return;
      }

      setAiFailure(toApiLoadFailure(err));
      setAiExplanation(null);
    } finally {
      if (gen === aiGenerationRef.current) {
        setAiLoading(false);
      }
    }
  };

  return {
    aiExplanation,
    aiFailure,
    aiMalformed,
    aiLoading,
    loadAiExplanation,
    resetAiExplanation,
  };
}
