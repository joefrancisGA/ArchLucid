"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { ShortcutHint } from "@/components/ShortcutHint";
import { coerceComparisonExplanation, coerceGoldenManifestComparison, coerceRunComparison } from "@/lib/operator-response-guards";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { compareGoldenManifestRuns, compareRuns, explainComparisonRuns } from "@/lib/api";
import { fetchComparisonNarrativeViaAsk } from "@/lib/api/conversation-api";
import {
  compareRunIdsAreSameAfterDemoCanonicalization,
  readCompareRunIdsFromSearchParams,
} from "@/lib/compare-url-query-params";
import { BUYER_COMPARE_PAGE_TITLE } from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoGoldenManifestComparison,
  tryStaticDemoRunComparison,
} from "@/lib/operator-static-demo";
import { cn } from "@/lib/utils";
import { CompareBuyerScopedGate } from "@/app/(operator)/compare/_sections/CompareBuyerScopedGate";
import { CompareDemoQuickPick } from "@/app/(operator)/compare/_sections/CompareDemoQuickPick";
import { CompareLastRequestOutcomeDetails } from "@/app/(operator)/compare/_sections/CompareLastRequestOutcomeDetails";
import { ComparePageIntro } from "@/app/(operator)/compare/_sections/ComparePageIntro";
import { CompareResultsPanel } from "@/app/(operator)/compare/_sections/CompareResultsPanel";
import { CompareRunPickersSection } from "@/app/(operator)/compare/_sections/CompareRunPickersSection";
import type { ComparedPair } from "@/app/(operator)/compare/_sections/compare-page-helpers";
import { comparePickerFootnote } from "@/app/(operator)/compare/_sections/compare-page-helpers";
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

      return;
    }

    try {
      const legacy: unknown = await compareRuns(leftAtStart, rightAtStart);

      if (gen !== compareGenerationRef.current) {
        return;
      }

      const coercedLegacy = coerceRunComparison(legacy);

      if (!coercedLegacy.ok) {
        setResult(null);
        setLegacyMalformed(coercedLegacy.message);
      } else {
        setResult(coercedLegacy.value);
      }
    } catch (err) {
      if (gen !== compareGenerationRef.current) {
        return;
      }

      setLegacyFailure(toApiLoadFailure(err));
      setResult(null);
    }

    try {
      const structured: unknown = await compareGoldenManifestRuns(leftAtStart, rightAtStart);

      if (gen !== compareGenerationRef.current) {
        return;
      }

      const coercedGolden = coerceGoldenManifestComparison(structured);

      if (!coercedGolden.ok) {
        setGolden(null);
        setGoldenMalformed(coercedGolden.message);
      } else {
        setGolden(coercedGolden.value);
      }
    } catch (err) {
      if (gen !== compareGenerationRef.current) {
        return;
      }

      setGoldenFailure(toApiLoadFailure(err));
      setGolden(null);
    } finally {
      if (gen === compareGenerationRef.current) {
        setLoading(false);
        setLastComparedPair({ left: leftAtStart, right: rightAtStart });
        void loadComparisonNarrative(leftAtStart, rightAtStart, gen);
      }
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
    if (!isBuyerPolishedOperatorShellEnv() || !isStaticDemoPayloadFallbackEnabled()) {
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

  const leftPickerLabel = isDemoClaimsIntakeComparePair
    ? "Baseline Claims Intake Review"
    : buyerPolished
      ? "Prior architecture review (same request)"
      : "Baseline review";
  const rightPickerLabel = isDemoClaimsIntakeComparePair
    ? "Updated Claims Intake Review"
    : buyerPolished
      ? "Later architecture review (same request)"
      : "Updated review";

  const pickClaimsIntakePair = () => {
    setLeftRunId(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID);
    setRightRunId(SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
  };

  const urlComparePair = readCompareRunIdsFromSearchParams(searchParams);
  const buyerCompareHasUrlPair =
    urlComparePair.prior.trim().length > 0 && urlComparePair.later.trim().length > 0;
  const showBuyerCompareScopedGate =
    buyerPolished &&
    !buyerCompareHasUrlPair &&
    !compareHasRenderableOutcome &&
    leftTrim.length === 0 &&
    rightTrim.length === 0;

  const loadBuyerSampleComparison = () => {
    pickClaimsIntakePair();

    if (isStaticDemoPayloadFallbackEnabled()) {
      void runCompareForPair(SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID, SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID);
    }
  };

  return (
    <div>
      <LayerHeader pageKey="compare" />
      <OperatorPageHeader
        title={buyerPolished ? BUYER_COMPARE_PAGE_TITLE : "Compare reviews"}
        helpKey="compare-runs"
        docsPageKey="/compare"
        metadata={
          isBuyerPolishedOperatorShellEnv() ? undefined : (
            <ShortcutHint shortcut="Alt+C" className="text-[0.75rem] text-neutral-500" />
          )
        }
      />
      <ComparePageIntro buyerPolished={buyerPolished} />
      {showBuyerCompareScopedGate ? (
        <CompareBuyerScopedGate onLoadSampleComparison={loadBuyerSampleComparison} />
      ) : null}
      {isStaticDemoPayloadFallbackEnabled() && !buyerPolished ? (
        <CompareDemoQuickPick onPickClaimsIntake={pickClaimsIntakePair} />
      ) : null}
      <div
        className={cn("flex max-w-3xl flex-col gap-8", compareInsightFirstLayout ? "flex-col-reverse" : null)}
      >
        {showBuyerCompareScopedGate ? null : (
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
          collapseBelowResults={compareInsightFirstLayout && buyerPolished}
        />
        )}

        {showBuyerCompareScopedGate ? null : (
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
        />
        )}
      </div>

      {showBuyerCompareScopedGate ? null : (
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
      )}
    </div>
  );
}
