"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import {
  compareRunIdsAreSameAfterDemoCanonicalization,
  readCompareRunIdsFromSearchParams,
} from "@/lib/compare-url-query-params";
import { BUYER_COMPARE_PAGE_TITLE, BUYER_COMPARE_PRIMARY_ACTION_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  resolveCompareTwoReviewsEmphasizedStepId,
  resolveCompareTwoReviewsSteps,
} from "@/lib/compare-two-reviews-checklist";
import { COMPARE_PAGE_SUBTITLE } from "@/app/(operator)/insights/compare-two-reviews/_sections/ComparePageIntro";
import { useCompareFormUrlSync } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-url-sync";
import { useCompareFormFetch } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-fetch";
import { useCompareFormAiExplanation } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-ai-explanation";
import { useCompareFinalizedRunAvailability } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFinalizedRunAvailability";
import { comparePickerFootnote } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
} from "@/lib/showcase-static-demo";

export function useCompareForm() {
  const searchParams = useSearchParams();
  const initialUrlPair = readCompareRunIdsFromSearchParams(searchParams);
  const [leftRunId, setLeftRunId] = useState(initialUrlPair.prior);
  const [rightRunId, setRightRunId] = useState(initialUrlPair.later);

  const {
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
  } = useCompareFormFetch();

  const {
    aiExplanation,
    aiFailure,
    aiMalformed,
    aiLoading,
    loadAiExplanation,
    resetAiExplanation,
  } = useCompareFormAiExplanation();

  const runCompareForPairWithAiReset = useCallback(
    async (leftAtStart: string, rightAtStart: string) => {
      await runCompareForPair(leftAtStart, rightAtStart, resetAiExplanation);
    },
    [resetAiExplanation, runCompareForPair],
  );

  const { syncSelectionToUrl } = useCompareFormUrlSync({
    setLeftRunId,
    setRightRunId,
    runCompareForPair: runCompareForPairWithAiReset,
  });

  const handleLeftRunIdChange = useCallback(
    (runId: string) => {
      setLeftRunId(runId);
      syncSelectionToUrl(runId, rightRunId);
    },
    [rightRunId, syncSelectionToUrl],
  );

  const handleRightRunIdChange = useCallback(
    (runId: string) => {
      setRightRunId(runId);
      syncSelectionToUrl(leftRunId, runId);
    },
    [leftRunId, syncSelectionToUrl],
  );

  useEffect(() => {
    setLeftPickedSummary((prev) => {
      if (prev === null) {
        return null;
      }

      if (canonicalizeDemoRunId(prev.runId).toLowerCase() !== canonicalizeDemoRunId(leftRunId.trim()).toLowerCase()) {
        return null;
      }

      return prev;
    });
  }, [leftRunId, setLeftPickedSummary]);

  useEffect(() => {
    setRightPickedSummary((prev) => {
      if (prev === null) {
        return null;
      }

      if (canonicalizeDemoRunId(prev.runId).toLowerCase() !== canonicalizeDemoRunId(rightRunId.trim()).toLowerCase()) {
        return null;
      }

      return prev;
    });
  }, [rightRunId, setRightPickedSummary]);

  const leftTrim = leftRunId.trim();
  const rightTrim = rightRunId.trim();
  const sameCanonicalRunIdsBlocked = compareRunIdsAreSameAfterDemoCanonicalization(leftTrim, rightTrim);
  const leftFootnote = comparePickerFootnote(leftTrim, leftPickedSummary);
  const rightFootnote = comparePickerFootnote(rightTrim, rightPickedSummary);
  const isDemoClaimsIntakeComparePair =
    isStaticDemoPayloadFallbackEnabled() &&
    leftTrim === SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID &&
    rightTrim === SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID;
  const pairAligned =
    lastComparedPair !== null && lastComparedPair.left === leftTrim && lastComparedPair.right === rightTrim;
  const showStaleInputsWarning =
    !pairAligned &&
    lastComparedPair !== null &&
    (result !== null ||
      golden !== null ||
      legacyFailure !== null ||
      goldenFailure !== null ||
      legacyMalformed !== null ||
      goldenMalformed !== null ||
      aiExplanation !== null ||
      aiFailure !== null ||
      aiMalformed !== null);

  const compareHasRenderableOutcome =
    golden !== null ||
    result !== null ||
    aiExplanation !== null ||
    legacyFailure !== null ||
    goldenFailure !== null ||
    legacyMalformed !== null ||
    goldenMalformed !== null ||
    aiFailure !== null ||
    aiMalformed !== null;

  const compareInsightFirstLayout = pairAligned && !loading && compareHasRenderableOutcome;
  const compareComplete = lastComparedPair !== null && (result !== null || golden !== null);
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

    await runCompareForPairWithAiReset(leftTrim, rightTrim);
  };

  const hasResultsToNavigate =
    pairAligned && !loading && (golden !== null || result !== null || aiExplanation !== null);

  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const { finalizedCount, insufficientForCompare } = useCompareFinalizedRunAvailability();

  const leftPickerLabel = isDemoClaimsIntakeComparePair ? "Baseline Claims Intake Review" : "Baseline review";
  const rightPickerLabel = isDemoClaimsIntakeComparePair ? "Updated Claims Intake Review" : "Updated review";

  const pickClaimsIntakePair = () => {
    setLeftRunId(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID);
    setRightRunId(SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
  };

  const urlComparePair = readCompareRunIdsFromSearchParams(searchParams);
  const urlPairComplete =
    urlComparePair.prior.trim().length > 0 && urlComparePair.later.trim().length > 0;
  const buyerCompareHasUrlPair = urlPairComplete;
  const hasPrefilledSelection = leftTrim.length > 0 || rightTrim.length > 0;
  const showInsufficientFinalized =
    buyerPolished &&
    insufficientForCompare &&
    !hasPrefilledSelection &&
    !buyerCompareHasUrlPair &&
    !compareHasRenderableOutcome;
  const showEmptyComparisonOutput = !loading && !compareHasRenderableOutcome;

  const loadBuyerSampleComparison = () => {
    pickClaimsIntakePair();

    if (isStaticDemoPayloadFallbackEnabled()) {
      void runCompareForPairWithAiReset(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID, SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
    }
  };

  const showRelatedReviewLinks =
    leftTrim.length > 0 ||
    rightTrim.length > 0 ||
    (lastComparedPair !== null && (lastComparedPair.left.length > 0 || lastComparedPair.right.length > 0)) ||
    isStaticDemoPayloadFallbackEnabled();

  const showContinueLastComparisonRow =
    continueLastPair !== null && !hasPrefilledSelection && !buyerCompareHasUrlPair;

  return {
    comparePagePath: COMPARE_TWO_REVIEWS_PATH,
    comparePageSubtitle: COMPARE_PAGE_SUBTITLE,
    buyerComparePageTitle: BUYER_COMPARE_PAGE_TITLE,
    buyerComparePrimaryActionLabel: BUYER_COMPARE_PRIMARY_ACTION_LABEL,
    leftRunId,
    rightRunId,
    setLeftRunId,
    setRightRunId,
    result,
    golden,
    legacyFailure,
    goldenFailure,
    legacyMalformed,
    goldenMalformed,
    loading,
    aiExplanation,
    aiFailure,
    aiMalformed,
    aiLoading,
    comparisonNarrative,
    comparisonNarrativeLoading,
    lastComparedPair,
    leftPickedSummary,
    rightPickedSummary,
    continueLastPair,
    syncSelectionToUrl,
    handleLeftRunIdChange,
    handleRightRunIdChange,
    setLeftPickedSummary,
    setRightPickedSummary,
    leftTrim,
    rightTrim,
    sameCanonicalRunIdsBlocked,
    leftFootnote,
    rightFootnote,
    pairAligned,
    showStaleInputsWarning,
    compareHasRenderableOutcome,
    compareInsightFirstLayout,
    compareChecklistSteps,
    compareChecklistEmphasizedStepId,
    onCompare,
    loadAiExplanation: () => loadAiExplanation(leftTrim, rightTrim, sameCanonicalRunIdsBlocked),
    hasResultsToNavigate,
    buyerPolished,
    finalizedCount,
    leftPickerLabel,
    rightPickerLabel,
    pickClaimsIntakePair,
    urlPairComplete,
    showInsufficientFinalized,
    showEmptyComparisonOutput,
    loadBuyerSampleComparison,
    showRelatedReviewLinks,
    showContinueLastComparisonRow,
  };
}
