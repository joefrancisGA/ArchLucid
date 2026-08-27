"use client";

import Link from "next/link";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PageShortcutsDisclosure } from "@/components/usability/PageShortcutsDisclosure";
import { ValidateCompareVocabularyRail } from "@/components/ValidateCompareVocabularyRail";
import { ImpactPreviewCompareVocabularyRail } from "@/components/ImpactPreviewCompareVocabularyRail";
import { CompareContinueLastComparisonRow } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareContinueLastComparisonRow";
import { CompareNextReviewFooterClient } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareNextReviewFooterClient";
import { CompareEmptyResultsPlaceholder } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareEmptyResultsPlaceholder";
import { CompareHowComparisonWorksSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareHowComparisonWorksSection";
import { CompareRelatedReviewLinks } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareRelatedReviewLinks";
import { CompareSampleComparisonAction } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareSampleComparisonAction";
import { CompareDemoQuickPick } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareDemoQuickPick";
import { CompareNaturalPairSuggestion } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareNaturalPairSuggestion";
import { CompareComparisonDimensionsPreview } from "./CompareComparisonDimensionsPreview";
import { CompareInsufficientFinalizedEmptyState } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareInsufficientFinalizedEmptyState";
import { CompareLastRequestOutcomeDetails } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareLastRequestOutcomeDetails";
import { CompareResultsPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanel";
import { CompareAdvancedDiagnosticsSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareAdvancedDiagnosticsSection";
import { CompareRunPickersSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { compareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { useCompareForm } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-form";

/**
 * Compare form: two review IDs; structured manifest diff and optional legacy diff on Compare; optional AI explanation.
 */
export function CompareForm() {
  const {
    comparePagePath,
    comparePageShortcuts,
    comparePageSubtitle,
    buyerComparePageTitle,
    buyerComparePrimaryActionLabel,
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
    loadAiExplanation,
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
  } = useCompareForm();

  return (
    <OperatorPageContainer
      variant="workflow"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="compare-page-ready"
    >
      <OperatorPageHeader
        navHref={comparePagePath}
        title={buyerPolished ? buyerComparePageTitle : "Compare two reviews"}
        titleTestId="compare-page-heading"
        subtitle={comparePageSubtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="compare-page-header-actions">
            <PageShortcutsDisclosure testId="compare-page-shortcuts" entries={comparePageShortcuts} />
            <PageContextualHelpButton />
          </div>
        }
      />
      {!buyerPolished ? (
        <OperatorRelatedSurfacesDisclosure testId="compare-related-surfaces-disclosure">
          <ValidateCompareVocabularyRail currentSurfaceId="compare" />
          <ImpactPreviewCompareVocabularyRail currentSurfaceId="compare" />
          <PageCapabilityBoundaryStrip surfaceId="compare" className="mb-0" />
        </OperatorRelatedSurfacesDisclosure>
      ) : null}
      {showInsufficientFinalized ? (
        <CompareInsufficientFinalizedEmptyState
          finalizedCount={finalizedCount}
          onLoadSampleComparison={loadBuyerSampleComparison}
        />
      ) : null}
      {isStaticDemoPayloadFallbackEnabled() && !buyerPolished ? (
        <CompareDemoQuickPick onPickClaimsIntake={pickClaimsIntakePair} />
      ) : null}
      {showContinueLastComparisonRow && continueLastPair !== null ? (
        <CompareContinueLastComparisonRow pair={continueLastPair} />
      ) : null}
      {!isStaticDemoPayloadFallbackEnabled() ? (
        <CompareNaturalPairSuggestion
          leftRunId={leftRunId}
          rightRunId={rightRunId}
          onApplyPair={(priorRunId, laterRunId) => {
            setLeftRunId(priorRunId);
            setRightRunId(laterRunId);
            syncSelectionToUrl(priorRunId, laterRunId);
          }}
        />
      ) : null}
      <div className={cn("flex flex-col", OPERATOR_LAYOUT.unrelatedClusterGap)} data-testid="compare-workspace">
        {buyerPolished ? (
          <div className="flex flex-col gap-4">
            <CompareComparisonDimensionsPreview />
            <div className="flex flex-wrap items-center gap-2">
              {showRelatedReviewLinks ? (
                <CompareRelatedReviewLinks
                  baselineRunId={leftTrim}
                  updatedRunId={rightTrim}
                  preferredRunId={lastComparedPair?.right ?? rightTrim}
                />
              ) : null}
              {showEmptyComparisonOutput ? (
                <CompareSampleComparisonAction onLoadSampleComparison={loadBuyerSampleComparison} />
              ) : null}
            </div>
          </div>
        ) : null}

        <IntegrationConnectChecklist
          title="Compare checklist"
          steps={compareChecklistSteps}
          emphasizedStepId={compareChecklistEmphasizedStepId}
          testIdPrefix="compare-two-reviews"
        />

        {urlPairComplete ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="compare-two-reviews-run-scope-banner"
          >
            {"Comparing reviews "}
            <span className="font-mono text-al-text-primary">{leftTrim}</span>
            {" and "}
            <span className="font-mono text-al-text-primary">{rightTrim}</span>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={compareTwoReviewsHref()}>
              Clear comparison scope
            </Link>
            {" · "}
            <Link
              className={OPERATOR_LINK.inline}
              href={`/architecture/reviews/${encodeURIComponent(rightTrim)}`}
            >
              Open updated review
            </Link>
          </p>
        ) : null}

        <CompareRunPickersSection
          leftPickerLabel={leftPickerLabel}
          rightPickerLabel={rightPickerLabel}
          leftRunId={leftRunId}
          rightRunId={rightRunId}
          onLeftRunIdChange={handleLeftRunIdChange}
          onRightRunIdChange={handleRightRunIdChange}
          leftFootnote={leftFootnote}
          rightFootnote={rightFootnote}
          leftTrim={leftTrim}
          rightTrim={rightTrim}
          loading={loading}
          aiLoading={aiLoading}
          pairAligned={pairAligned}
          sameCanonicalRunIdsBlocked={sameCanonicalRunIdsBlocked}
          onCompare={onCompare}
          onSummarizeForSponsor={loadAiExplanation}
          onLeftRunPicked={setLeftPickedSummary}
          onRightRunPicked={setRightPickedSummary}
          useBuyerFacingRunLabels={buyerPolished}
          summarizeButtonLabel={buyerPolished ? "Summarize for leadership" : "Summarize for sponsor"}
          compareButtonLabel={buyerPolished ? buyerComparePrimaryActionLabel : "Compare two reviews"}
          collapseBelowResults={(compareInsightFirstLayout && buyerPolished) || urlPairComplete}
        />

        {!compareInsightFirstLayout && showEmptyComparisonOutput && !urlPairComplete ? (
          <CompareEmptyResultsPlaceholder />
        ) : null}

        {urlPairComplete ? (
          <CompareResultsPanel
            showStaleInputsWarning={showStaleInputsWarning}
            lastComparedPair={lastComparedPair}
            leftPickedSummary={leftPickedSummary}
            rightPickedSummary={rightPickedSummary}
            loading={loading}
            leftTrim={leftTrim}
            rightTrim={rightTrim}
            aiLoading={aiLoading}
            legacyFailure={legacyFailure}
            legacyMalformed={legacyMalformed}
            goldenFailure={goldenFailure}
            goldenMalformed={goldenMalformed}
            aiFailure={aiFailure}
            aiMalformed={aiMalformed}
            hasResultsToNavigate={hasResultsToNavigate}
            golden={golden}
            result={result}
            aiExplanation={aiExplanation}
            comparisonNarrative={comparisonNarrative}
            comparisonNarrativeLoading={comparisonNarrativeLoading}
            buyerPolished={buyerPolished}
            resultsFirst={compareInsightFirstLayout}
          />
        ) : null}
      </div>

      {urlPairComplete ? (
        <CompareLastRequestOutcomeDetails
          pairAligned={pairAligned}
          loading={loading}
          lastComparedPair={lastComparedPair}
          showStaleInputsWarning={showStaleInputsWarning}
          leftPickedSummary={leftPickedSummary}
          rightPickedSummary={rightPickedSummary}
          golden={golden}
          goldenFailure={goldenFailure}
          goldenMalformed={goldenMalformed}
          result={result}
          legacyFailure={legacyFailure}
          legacyMalformed={legacyMalformed}
          buyerPolished={buyerPolished}
        />
      ) : null}

      {buyerPolished ? (
        <CompareHowComparisonWorksSection />
      ) : (
        <>
          <LayerHeader pageKey="compare" density="compact" collapsibleGuidance="How compare works" />
          <CompareAdvancedDiagnosticsSection />
        </>
      )}

      {leftTrim.length > 0 || rightTrim.length > 0 ? (
        <CompareNextReviewFooterClient priorRunId={leftTrim} laterRunId={rightTrim} />
      ) : null}
    </OperatorPageContainer>
  );
}
