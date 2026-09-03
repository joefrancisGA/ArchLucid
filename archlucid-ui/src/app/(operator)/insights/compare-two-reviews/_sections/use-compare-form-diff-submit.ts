"use client";

import { useCallback } from "react";

import { useCompareFormAiExplanation } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-ai-explanation";
import { useCompareFormFetch } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-fetch";
import type { ComparedPair } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import {
  resolveCompareTwoReviewsEmphasizedStepId,
  resolveCompareTwoReviewsSteps,
} from "@/lib/compare-two-reviews-checklist";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { ComparisonExplanation } from "@/types/explanation";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { RunComparison, RunSummary } from "@/types/authority";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export function useCompareFormDiffSubmit(options: {
  readonly leftTrim: string;
  readonly rightTrim: string;
  readonly sameCanonicalRunIdsBlocked: boolean;
  readonly hasPrefilledSelection: boolean;
  readonly buyerCompareHasUrlPair: boolean;
  readonly buyerPolished: boolean;
  readonly insufficientForCompare: boolean;
  readonly pickClaimsIntakePair: () => void;
}) {
  const {
    leftTrim,
    rightTrim,
    sameCanonicalRunIdsBlocked,
    hasPrefilledSelection,
    buyerCompareHasUrlPair,
    buyerPolished,
    insufficientForCompare,
    pickClaimsIntakePair,
  } = options;

  const fetch = useCompareFormFetch();
  const ai = useCompareFormAiExplanation();

  const runCompareForPair = useCallback(
    async (leftAtStart: string, rightAtStart: string) => {
      await fetch.runCompareForPair(leftAtStart, rightAtStart, ai.resetAiExplanation);
    },
    [ai.resetAiExplanation, fetch],
  );

  const pairAligned =
    fetch.lastComparedPair !== null &&
    fetch.lastComparedPair.left === leftTrim &&
    fetch.lastComparedPair.right === rightTrim;

  const showStaleInputsWarning =
    !pairAligned &&
    fetch.lastComparedPair !== null &&
    (fetch.result !== null ||
      fetch.golden !== null ||
      fetch.legacyFailure !== null ||
      fetch.goldenFailure !== null ||
      fetch.legacyMalformed !== null ||
      fetch.goldenMalformed !== null ||
      ai.aiExplanation !== null ||
      ai.aiFailure !== null ||
      ai.aiMalformed !== null);

  const compareHasRenderableOutcome =
    fetch.golden !== null ||
    fetch.result !== null ||
    ai.aiExplanation !== null ||
    fetch.legacyFailure !== null ||
    fetch.goldenFailure !== null ||
    fetch.legacyMalformed !== null ||
    fetch.goldenMalformed !== null ||
    ai.aiFailure !== null ||
    ai.aiMalformed !== null;

  const compareInsightFirstLayout = pairAligned && !fetch.loading && compareHasRenderableOutcome;
  const compareComplete = fetch.lastComparedPair !== null && (fetch.result !== null || fetch.golden !== null);
  const compareChecklistSteps = resolveCompareTwoReviewsSteps({
    priorPicked: leftTrim.length > 0,
    laterPicked: rightTrim.length > 0,
    compareComplete,
  });
  const compareChecklistEmphasizedStepId = resolveCompareTwoReviewsEmphasizedStepId({
    priorPicked: leftTrim.length > 0,
    laterPicked: rightTrim.length > 0,
    compareComplete,
  });

  const onCompare = async () => {
    if (sameCanonicalRunIdsBlocked) {
      return;
    }

    await runCompareForPair(leftTrim, rightTrim);
  };

  const loadAiExplanation = async () => {
    await ai.loadAiExplanation(leftTrim, rightTrim, sameCanonicalRunIdsBlocked);
  };

  const hasResultsToNavigate =
    pairAligned && !fetch.loading && (fetch.golden !== null || fetch.result !== null || ai.aiExplanation !== null);

  const showInsufficientFinalized =
    buyerPolished &&
    insufficientForCompare &&
    !hasPrefilledSelection &&
    !buyerCompareHasUrlPair &&
    !compareHasRenderableOutcome;
  const showEmptyComparisonOutput = !fetch.loading && !compareHasRenderableOutcome;

  const loadBuyerSampleComparison = () => {
    pickClaimsIntakePair();

    if (isStaticDemoPayloadFallbackEnabled()) {
      void runCompareForPair(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID, SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
    }
  };

  const showContinueLastComparisonRow =
    fetch.continueLastPair !== null && !hasPrefilledSelection && !buyerCompareHasUrlPair;

  return {
    result: fetch.result as RunComparison | null,
    golden: fetch.golden as GoldenManifestComparison | null,
    legacyFailure: fetch.legacyFailure as ApiLoadFailureState | null,
    goldenFailure: fetch.goldenFailure as ApiLoadFailureState | null,
    legacyMalformed: fetch.legacyMalformed,
    goldenMalformed: fetch.goldenMalformed,
    loading: fetch.loading,
    aiExplanation: ai.aiExplanation as ComparisonExplanation | null,
    aiFailure: ai.aiFailure as ApiLoadFailureState | null,
    aiMalformed: ai.aiMalformed,
    aiLoading: ai.aiLoading,
    comparisonNarrative: fetch.comparisonNarrative,
    comparisonNarrativeLoading: fetch.comparisonNarrativeLoading,
    lastComparedPair: fetch.lastComparedPair as ComparedPair | null,
    continueLastPair: fetch.continueLastPair,
    leftPickedSummary: fetch.leftPickedSummary as RunSummary | null,
    rightPickedSummary: fetch.rightPickedSummary as RunSummary | null,
    setLeftPickedSummary: fetch.setLeftPickedSummary,
    setRightPickedSummary: fetch.setRightPickedSummary,
    runCompareForPair,
    pairAligned,
    showStaleInputsWarning,
    compareHasRenderableOutcome,
    compareInsightFirstLayout,
    compareChecklistSteps,
    compareChecklistEmphasizedStepId,
    onCompare,
    loadAiExplanation,
    hasResultsToNavigate,
    showInsufficientFinalized,
    showEmptyComparisonOutput,
    loadBuyerSampleComparison,
    showContinueLastComparisonRow,
  };
}
