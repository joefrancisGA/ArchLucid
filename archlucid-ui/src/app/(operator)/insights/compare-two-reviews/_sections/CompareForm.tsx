"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LayerHeader } from "@/components/LayerHeader";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PageShortcutsDisclosure } from "@/components/usability/PageShortcutsDisclosure";
import { COMPARE_PAGE_SHORTCUTS } from "@/lib/compare-page-shortcuts";
import { ValidateCompareVocabularyRail } from "@/components/ValidateCompareVocabularyRail";
import { ImpactPreviewCompareVocabularyRail } from "@/components/ImpactPreviewCompareVocabularyRail";
import { coerceComparisonExplanation, coerceGoldenManifestComparison, coerceRunComparison } from "@/lib/operator/operator-response-guards";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { compareGoldenManifestRuns, compareRuns, explainComparisonRuns, getRunSummary } from "@/lib/api";
import { fetchComparisonNarrativeViaAsk } from "@/lib/api/conversation-api";
import {
  compareRunIdsAreSameAfterDemoCanonicalization,
  comparePageHrefAdaptive,
  readCompareRunIdsFromSearchParams,
} from "@/lib/compare-url-query-params";
import { BUYER_COMPARE_PAGE_TITLE, BUYER_COMPARE_PRIMARY_ACTION_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoGoldenManifestComparison,
  tryStaticDemoRunComparison,
} from "@/lib/operator/operator-static-demo";
import { CompareContinueLastComparisonRow } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareContinueLastComparisonRow";
import { CompareNextReviewFooterClient } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareNextReviewFooterClient";
import {
  readCompareLastComparisonPair,
  writeCompareLastComparisonPair,
  type CompareLastComparisonPair,
} from "@/lib/compare/compare-last-comparison-pair-storage";
import {
  resolveCompareTwoReviewsEmphasizedStepId,
  resolveCompareTwoReviewsSteps,
} from "@/lib/compare-two-reviews-checklist";
import { CompareEmptyResultsPlaceholder } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareEmptyResultsPlaceholder";
import { CompareHowComparisonWorksSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareHowComparisonWorksSection";
import { CompareRelatedReviewLinks } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareRelatedReviewLinks";
import { CompareSampleComparisonAction } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareSampleComparisonAction";
import { CompareDemoQuickPick } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareDemoQuickPick";
import { CompareNaturalPairSuggestion } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareNaturalPairSuggestion";
import { CompareInsufficientFinalizedEmptyState } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareInsufficientFinalizedEmptyState";
import { CompareLastRequestOutcomeDetails } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareLastRequestOutcomeDetails";
import { COMPARE_PAGE_SUBTITLE } from "@/app/(operator)/insights/compare-two-reviews/_sections/ComparePageIntro";
import { CompareResultsPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanel";
import { CompareAdvancedDiagnosticsSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareAdvancedDiagnosticsSection";
import { CompareRunPickersSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { useCompareFinalizedRunAvailability } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFinalizedRunAvailability";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ComparedPair } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import { comparePickerFootnote } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { ComparisonExplanation } from "@/types/explanation";
import type { RunComparison, RunSummary } from "@/types/authority";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
} from "@/lib/showcase-static-demo";

/**
 * Compare form: two review IDs; structured manifest diff and optional legacy diff on Compare; optional AI explanation.
 */
export function CompareForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareGenerationRef = useRef(0);
  const aiGenerationRef = useRef(0);
  const autoComparedFromUrlRef = useRef(false);
  const initialUrlPair = readCompareRunIdsFromSearchParams(searchParams);
  const [leftRunId, setLeftRunId] = useState(initialUrlPair.prior);
  const [rightRunId, setRightRunId] = useState(initialUrlPair.later);
  const [result, setResult] = useState<RunComparison | null>(null);
  const [golden, setGolden] = useState<GoldenManifestComparison | null>(null);
  const [legacyFailure, setLegacyFailure] = useState<ApiLoadFailureState | null>(null);
  const [goldenFailure, setGoldenFailure] = useState<ApiLoadFailureState | null>(null);
  const [legacyMalformed, setLegacyMalformed] = useState<string | null>(null);
  const [goldenMalformed, setGoldenMalformed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<ComparisonExplanation | null>(null);
  const [aiFailure, setAiFailure] = useState<ApiLoadFailureState | null>(null);
  const [aiMalformed, setAiMalformed] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [comparisonNarrative, setComparisonNarrative] = useState<string | null>(null);
  const [comparisonNarrativeLoading, setComparisonNarrativeLoading] = useState(false);
  const [lastComparedPair, setLastComparedPair] = useState<ComparedPair | null>(null);
  const [leftPickedSummary, setLeftPickedSummary] = useState<RunSummary | null>(null);
  const [rightPickedSummary, setRightPickedSummary] = useState<RunSummary | null>(null);
  const [continueLastPair, setContinueLastPair] = useState<CompareLastComparisonPair | null>(null);

  useEffect(() => {
    setContinueLastPair(readCompareLastComparisonPair());
  }, []);

  const syncSelectionToUrl = useCallback(
    (priorRunId: string, laterRunId: string) => {
      router.replace(comparePageHrefAdaptive(priorRunId, laterRunId), { scroll: false });
    },
    [router],
  );

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

  const runCompareForPair = useCallback(async (leftAtStart: string, rightAtStart: string) => {
    const gen = ++compareGenerationRef.current;

    setLoading(true);
    setLegacyFailure(null);
    setGoldenFailure(null);
    setLegacyMalformed(null);
    setGoldenMalformed(null);
    setResult(null);
    setGolden(null);
    setAiExplanation(null);
    setAiFailure(null);
    setAiMalformed(null);
    setComparisonNarrative(null);
    setComparisonNarrativeLoading(false);
    setLastComparedPair(null);

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
  }, [hydratePickedSummariesForPair]);

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

  useEffect(() => {
    const { prior: left, later: right } = readCompareRunIdsFromSearchParams(searchParams);

    if (left.length > 0) {
      setLeftRunId(left);
    }

    if (right.length > 0) {
      setRightRunId(right);
    }
  }, [searchParams]);

  useEffect(() => {
    const { prior: left, later: right } = readCompareRunIdsFromSearchParams(searchParams);

    if (left.length === 0 || right.length === 0 || autoComparedFromUrlRef.current) {
      return;
    }

    autoComparedFromUrlRef.current = true;

    if (compareRunIdsAreSameAfterDemoCanonicalization(left, right)) {
      return;
    }

    void runCompareForPair(left, right);
  }, [searchParams, runCompareForPair]);

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
  }, [leftRunId]);

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
  }, [rightRunId]);

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

  async function onCompare() {
    if (sameCanonicalRunIdsBlocked) {
      return;
    }

    await runCompareForPair(leftTrim, rightTrim);
  }

  async function loadAiExplanation() {
    if (!leftTrim || !rightTrim) return;

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
  }

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
      void runCompareForPair(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID, SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
    }
  };

  const showRelatedReviewLinks =
    leftTrim.length > 0 ||
    rightTrim.length > 0 ||
    (lastComparedPair !== null && (lastComparedPair.left.length > 0 || lastComparedPair.right.length > 0)) ||
    isStaticDemoPayloadFallbackEnabled();

  const showContinueLastComparisonRow =
    continueLastPair !== null && !hasPrefilledSelection && !buyerCompareHasUrlPair;

  return (
    <OperatorPageContainer
      variant="workflow"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="compare-page-ready"
    >
      <OperatorPageHeader
        navHref={COMPARE_TWO_REVIEWS_PATH}
        title={buyerPolished ? BUYER_COMPARE_PAGE_TITLE : "Compare two reviews"}
        titleTestId="compare-page-heading"
        subtitle={COMPARE_PAGE_SUBTITLE}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="compare-page-header-actions">
            <PageShortcutsDisclosure testId="compare-page-shortcuts" entries={COMPARE_PAGE_SHORTCUTS} />
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
          compareButtonLabel={buyerPolished ? BUYER_COMPARE_PRIMARY_ACTION_LABEL : "Compare two reviews"}
          collapseBelowResults={compareInsightFirstLayout && buyerPolished}
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
