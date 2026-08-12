"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ValidateCompareVocabularyRail } from "@/components/ValidateCompareVocabularyRail";
import { ImpactPreviewCompareVocabularyRail } from "@/components/ImpactPreviewCompareVocabularyRail";
import { coerceComparisonExplanation, coerceGoldenManifestComparison, coerceRunComparison } from "@/lib/operator/operator-response-guards";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { compareGoldenManifestRuns, compareRuns, explainComparisonRuns, getRunSummary } from "@/lib/api";
import { fetchComparisonNarrativeViaAsk } from "@/lib/api/conversation-api";
import {
  compareRunIdsAreSameAfterDemoCanonicalization,
  readCompareRunIdsFromSearchParams,
} from "@/lib/compare-url-query-params";
import { BUYER_COMPARE_PAGE_TITLE, BUYER_COMPARE_PRIMARY_ACTION_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import {
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoGoldenManifestComparison,
  tryStaticDemoRunComparison,
} from "@/lib/operator/operator-static-demo";
import { CompareComparisonDimensionsPreview } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareComparisonDimensionsPreview";
import { CompareEmptyResultsPlaceholder } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareEmptyResultsPlaceholder";
import { CompareHowComparisonWorksSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareHowComparisonWorksSection";
import { CompareRelatedReviewLinks } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareRelatedReviewLinks";
import { CompareSampleComparisonAction } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareSampleComparisonAction";
import { CompareDemoQuickPick } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareDemoQuickPick";
import { CompareInsufficientFinalizedEmptyState } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareInsufficientFinalizedEmptyState";
import { CompareLastRequestOutcomeDetails } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareLastRequestOutcomeDetails";
import { COMPARE_PAGE_SUBTITLE } from "@/app/(operator)/insights/compare-two-reviews/_sections/ComparePageIntro";
import { CompareResultsPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanel";
import { CompareAdvancedDiagnosticsSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareAdvancedDiagnosticsSection";
import { CompareRunPickersSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection";
import { useCompareFinalizedRunAvailability } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFinalizedRunAvailability";
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
  const searchParams = useSearchParams();
  const compareGenerationRef = useRef(0);
  const aiGenerationRef = useRef(0);
  const autoComparedFromUrlRef = useRef(false);
  const demoComparePrefillDoneRef = useRef(false);
  const buyerAutoSeedDoneRef = useRef(false);
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
    if (demoComparePrefillDoneRef.current) {
      return;
    }

    if (!isStaticDemoPayloadFallbackEnabled()) {
      return;
    }

    if (isBuyerPolishedOperatorShellEnv()) {
      return;
    }

    const { prior: priorQ, later: laterQ } = readCompareRunIdsFromSearchParams(searchParams);

    if (priorQ.length > 0 || laterQ.length > 0) {
      return;
    }

    if (leftRunId.trim().length > 0 || rightRunId.trim().length > 0) {
      return;
    }

    demoComparePrefillDoneRef.current = true;
    setLeftRunId(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID);
    setRightRunId(SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
  }, [searchParams, leftRunId, rightRunId]);

  useEffect(() => {
    if ((!isOperatorExperienceFullShellEnv() && !isCtoDemoPackEnv()) || !isStaticDemoPayloadFallbackEnabled()) {
      return;
    }

    if (buyerAutoSeedDoneRef.current) {
      return;
    }

    const { prior: priorQ, later: laterQ } = readCompareRunIdsFromSearchParams(searchParams);

    if (priorQ.length > 0 || laterQ.length > 0) {
      return;
    }

    buyerAutoSeedDoneRef.current = true;
    setLeftRunId(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID);
    setRightRunId(SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
    void runCompareForPair(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID, SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
  }, [searchParams, runCompareForPair]);

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
  const buyerCompareHasUrlPair =
    urlComparePair.prior.trim().length > 0 && urlComparePair.later.trim().length > 0;
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

  return (
    <div data-testid="compare-page-ready">
      <OperatorPageHeader
        title={buyerPolished ? BUYER_COMPARE_PAGE_TITLE : "Compare two reviews"}
        titleTestId="compare-page-heading"
        subtitle={COMPARE_PAGE_SUBTITLE}
        actions={<PageContextualHelpButton />}
      />
      <ValidateCompareVocabularyRail currentSurfaceId="compare" />
      <ImpactPreviewCompareVocabularyRail currentSurfaceId="compare" />
      <PageCapabilityBoundaryStrip surfaceId="compare" />
{showInsufficientFinalized ? (
        <CompareInsufficientFinalizedEmptyState
          finalizedCount={finalizedCount}
          onLoadSampleComparison={loadBuyerSampleComparison}
        />
      ) : null}
      {isStaticDemoPayloadFallbackEnabled() && !buyerPolished ? (
        <CompareDemoQuickPick onPickClaimsIntake={pickClaimsIntakePair} />
      ) : null}
      <div className="flex flex-col gap-6" data-testid="compare-workspace">
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

        <CompareRunPickersSection
          leftPickerLabel={leftPickerLabel}
          rightPickerLabel={rightPickerLabel}
          leftRunId={leftRunId}
          rightRunId={rightRunId}
          onLeftRunIdChange={setLeftRunId}
          onRightRunIdChange={setRightRunId}
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

        {!compareInsightFirstLayout && showEmptyComparisonOutput ? <CompareEmptyResultsPlaceholder /> : null}

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
      </div>

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

      {buyerPolished ? (
        <CompareHowComparisonWorksSection />
      ) : (
        <>
          <LayerHeader pageKey="compare" density="compact" collapsibleGuidance="How compare works" />
          <CompareAdvancedDiagnosticsSection />
        </>
      )}
    </div>
  );
}
