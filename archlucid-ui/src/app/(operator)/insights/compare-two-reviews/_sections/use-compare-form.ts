"use client";

import { useRef } from "react";

import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { BUYER_COMPARE_PAGE_TITLE, BUYER_COMPARE_PRIMARY_ACTION_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { useCompareFormUrlSync } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-url-sync";
import { useCompareFormRunSelection } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-run-selection";
import { useCompareFormDiffSubmit } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form-diff-submit";
import { COMPARE_PAGE_SUBTITLE } from "@/app/(operator)/insights/compare-two-reviews/_sections/ComparePageIntro";

export function useCompareForm() {
  const runCompareForPairRef = useRef<(left: string, right: string) => Promise<void>>(async () => {});
  const syncSelectionToUrlRef = useRef<(priorRunId: string, laterRunId: string) => void>(() => {});

  const selection = useCompareFormRunSelection({ syncSelectionToUrlRef });

  const diff = useCompareFormDiffSubmit({
    leftTrim: selection.leftTrim,
    rightTrim: selection.rightTrim,
    sameCanonicalRunIdsBlocked: selection.sameCanonicalRunIdsBlocked,
    hasPrefilledSelection: selection.hasPrefilledSelection,
    buyerCompareHasUrlPair: selection.buyerCompareHasUrlPair,
    buyerPolished: selection.buyerPolished,
    insufficientForCompare: selection.insufficientForCompare,
    pickClaimsIntakePair: selection.pickClaimsIntakePair,
  });

  runCompareForPairRef.current = diff.runCompareForPair;

  const urlSync = useCompareFormUrlSync({
    setLeftRunId: selection.setLeftRunId,
    setRightRunId: selection.setRightRunId,
    runCompareForPair: (left, right) => runCompareForPairRef.current(left, right),
  });

  syncSelectionToUrlRef.current = urlSync.syncSelectionToUrl;

  return {
    comparePagePath: COMPARE_TWO_REVIEWS_PATH,
    comparePageSubtitle: COMPARE_PAGE_SUBTITLE,
    buyerComparePageTitle: BUYER_COMPARE_PAGE_TITLE,
    buyerComparePrimaryActionLabel: BUYER_COMPARE_PRIMARY_ACTION_LABEL,
    leftRunId: selection.leftRunId,
    rightRunId: selection.rightRunId,
    setLeftRunId: selection.setLeftRunId,
    setRightRunId: selection.setRightRunId,
    result: diff.result,
    golden: diff.golden,
    legacyFailure: diff.legacyFailure,
    goldenFailure: diff.goldenFailure,
    legacyMalformed: diff.legacyMalformed,
    goldenMalformed: diff.goldenMalformed,
    loading: diff.loading,
    aiExplanation: diff.aiExplanation,
    aiFailure: diff.aiFailure,
    aiMalformed: diff.aiMalformed,
    aiLoading: diff.aiLoading,
    comparisonNarrative: diff.comparisonNarrative,
    comparisonNarrativeLoading: diff.comparisonNarrativeLoading,
    lastComparedPair: diff.lastComparedPair,
    leftPickedSummary: diff.leftPickedSummary,
    rightPickedSummary: diff.rightPickedSummary,
    continueLastPair: diff.continueLastPair,
    syncSelectionToUrl: urlSync.syncSelectionToUrl,
    handleLeftRunIdChange: selection.handleLeftRunIdChange,
    handleRightRunIdChange: selection.handleRightRunIdChange,
    setLeftPickedSummary: diff.setLeftPickedSummary,
    setRightPickedSummary: diff.setRightPickedSummary,
    leftTrim: selection.leftTrim,
    rightTrim: selection.rightTrim,
    sameCanonicalRunIdsBlocked: selection.sameCanonicalRunIdsBlocked,
    leftFootnote: selection.leftFootnote,
    rightFootnote: selection.rightFootnote,
    pairAligned: diff.pairAligned,
    showStaleInputsWarning: diff.showStaleInputsWarning,
    compareHasRenderableOutcome: diff.compareHasRenderableOutcome,
    compareInsightFirstLayout: diff.compareInsightFirstLayout,
    compareChecklistSteps: diff.compareChecklistSteps,
    compareChecklistEmphasizedStepId: diff.compareChecklistEmphasizedStepId,
    onCompare: diff.onCompare,
    loadAiExplanation: diff.loadAiExplanation,
    hasResultsToNavigate: diff.hasResultsToNavigate,
    buyerPolished: selection.buyerPolished,
    finalizedCount: selection.finalizedCount,
    leftPickerLabel: selection.leftPickerLabel,
    rightPickerLabel: selection.rightPickerLabel,
    pickClaimsIntakePair: selection.pickClaimsIntakePair,
    urlPairComplete: selection.urlPairComplete,
    showInsufficientFinalized: diff.showInsufficientFinalized,
    showEmptyComparisonOutput: diff.showEmptyComparisonOutput,
    loadBuyerSampleComparison: diff.loadBuyerSampleComparison,
    showRelatedReviewLinks:
      selection.showRelatedReviewLinks ||
      (diff.lastComparedPair !== null &&
        (diff.lastComparedPair.left.length > 0 || diff.lastComparedPair.right.length > 0)),
    showContinueLastComparisonRow: diff.showContinueLastComparisonRow,
  };
}
