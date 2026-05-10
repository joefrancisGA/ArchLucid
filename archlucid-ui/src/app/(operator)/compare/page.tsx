"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { ShortcutHint } from "@/components/ShortcutHint";
import {
  OperatorLoadingNotice,
  OperatorMalformedCallout,
  OperatorTryNext,
  OperatorWarningCallout,
} from "@/components/OperatorShellMessage";
import { COMPARE_WAITING } from "@/lib/empty-state-presets";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  coerceComparisonExplanation,
  coerceGoldenManifestComparison,
  coerceRunComparison,
} from "@/lib/operator-response-guards";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { AiComparisonExplanationView } from "@/components/compare/AiComparisonExplanationView";
import { LegacyRunComparisonView } from "@/components/compare/LegacyRunComparisonView";
import { StructuredComparisonView } from "@/components/compare/StructuredComparisonView";
import { RunIdPicker } from "@/components/RunIdPicker";
import { compareGoldenManifestRuns, compareRuns, explainComparisonRuns } from "@/lib/api";
import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { runSummaryDisplayLabel } from "@/lib/run-summary-display-label";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { ComparisonExplanation } from "@/types/explanation";
import type { RunComparison, RunSummary } from "@/types/authority";

type ComparedPair = { left: string; right: string };

/** Secondary hint under Compare pickers — demo slugs or API-backed label when the row was picked from the list. */
function comparePickerFootnote(runId: string, picked: RunSummary | null): string | null {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const demoLabel = compareRunBuyerDisplayLabel(trimmed);

  if (demoLabel !== null) {
    return demoLabel;
  }

  if (picked !== null) {
    const pickedId = picked.runId.trim();

    if (
      canonicalizeDemoRunId(pickedId).toLowerCase() === canonicalizeDemoRunId(trimmed).toLowerCase()
    ) {
      const label = runSummaryDisplayLabel(picked);

      if (label.toLowerCase() !== trimmed.toLowerCase()) {
        return label;
      }
    }
  }

  return null;
}

function outcomeLabel(params: {
  hasValue: boolean;
  failure: ApiLoadFailureState | null;
  malformed: string | null;
}): string {
  if (params.failure !== null) {
    return "Request failed";
  }

  if (params.malformed !== null) {
    return "Response not usable (shape)";
  }

  if (params.hasValue) {
    return "OK";
  }

  return "—";
}

/**
 * Compare form: two review IDs; structured manifest diff and optional legacy diff on Compare; optional AI explanation.
 */
function CompareForm() {
  const searchParams = useSearchParams();
  const compareGenerationRef = useRef(0);
  const aiGenerationRef = useRef(0);
  const autoComparedFromUrlRef = useRef(false);
  const demoComparePrefillDoneRef = useRef(false);
  const [leftRunId, setLeftRunId] = useState("");
  const [rightRunId, setRightRunId] = useState("");
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
    setLastComparedPair(null);

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
      }
    }
  }, []);

  useEffect(() => {
    const leftParam = searchParams.get("leftRunId")?.trim() ?? "";
    const fromParam = searchParams.get("fromRunId")?.trim() ?? "";
    const left = leftParam.length > 0 ? leftParam : fromParam;
    const right = searchParams.get("rightRunId")?.trim() ?? "";

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

    const leftQ = searchParams.get("leftRunId")?.trim() ?? "";
    const fromQ = searchParams.get("fromRunId")?.trim() ?? "";
    const leftQEffective = leftQ.length > 0 ? leftQ : fromQ;
    const rightQ = searchParams.get("rightRunId")?.trim() ?? "";

    if (leftQEffective.length > 0 || rightQ.length > 0) {
      return;
    }

    if (leftRunId.trim().length > 0 || rightRunId.trim().length > 0) {
      return;
    }

    demoComparePrefillDoneRef.current = true;
    setLeftRunId("claims-intake-run-v1");
    setRightRunId("claims-intake-run-v2");
  }, [searchParams, leftRunId, rightRunId]);

  useEffect(() => {
    const leftQ = searchParams.get("leftRunId")?.trim() ?? "";
    const fromQ = searchParams.get("fromRunId")?.trim() ?? "";
    const left = leftQ.length > 0 ? leftQ : fromQ;
    const right = searchParams.get("rightRunId")?.trim() ?? "";

    if (left.length === 0 || right.length === 0 || autoComparedFromUrlRef.current) {
      return;
    }

    autoComparedFromUrlRef.current = true;
    void runCompareForPair(left, right);
  }, [searchParams, runCompareForPair]);

  useEffect(() => {
    setLeftPickedSummary((prev) => {
      if (prev === null) {
        return null;
      }

      if (
        canonicalizeDemoRunId(prev.runId).toLowerCase() !== canonicalizeDemoRunId(leftRunId.trim()).toLowerCase()
      ) {
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

      if (
        canonicalizeDemoRunId(prev.runId).toLowerCase() !== canonicalizeDemoRunId(rightRunId.trim()).toLowerCase()
      ) {
        return null;
      }

      return prev;
    });
  }, [rightRunId]);

  const leftTrim = leftRunId.trim();
  const rightTrim = rightRunId.trim();
  const leftFootnote = comparePickerFootnote(leftTrim, leftPickedSummary);
  const rightFootnote = comparePickerFootnote(rightTrim, rightPickedSummary);
  const isDemoClaimsIntakeComparePair =
    isStaticDemoPayloadFallbackEnabled() &&
    leftTrim === "claims-intake-run-v1" &&
    rightTrim === "claims-intake-run-v2";
  const pairAligned =
    lastComparedPair !== null &&
    lastComparedPair.left === leftTrim &&
    lastComparedPair.right === rightTrim;
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
    await runCompareForPair(leftTrim, rightTrim);
  }

  async function loadAiExplanation() {
    if (!leftTrim || !rightTrim) return;

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
    ? "Claims Intake baseline review"
    : buyerPolished
      ? "Prior architecture review (same request)"
      : "Baseline review";
  const rightPickerLabel = isDemoClaimsIntakeComparePair
    ? "Claims Intake updated review"
    : buyerPolished
      ? "Later architecture review (same request)"
      : "Updated review";

  return (
    <div>
      <LayerHeader pageKey="compare" />
      <OperatorPageHeader
        title="Compare reviews"
        helpKey="compare-runs"
        docsPageKey="/compare"
        metadata={
          isBuyerPolishedOperatorShellEnv() ? undefined : (
            <ShortcutHint shortcut="Alt+C" className="text-[0.75rem] text-neutral-500" />
          )
        }
      />
      <p className="max-w-3xl leading-relaxed text-neutral-700 dark:text-neutral-300">
        {buyerPolished ? (
          <>
            Most teams compare the <strong>prior</strong> and <strong>later</strong> finalization for the{" "}
            <strong>same architecture request</strong> (N vs N+1). The structured summary below is the authoritative
            delta; open <strong>Summarize for sponsor</strong> only when you want a short narrative on top.
          </>
        ) : (
          <>
            Compare finalized manifests to understand what changed between two reviews—useful for sponsors, security review,
            and release checkpoints. <strong>Baseline</strong> is the reference; <strong>updated</strong> is what you are
            evaluating. After you compare, review the structured summary first; optional{" "}
            <strong>Summarize for sponsor</strong> adds a short narrative.
          </>
        )}
      </p>
      <p className="mb-0 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        The primary table is the <GlossaryTooltip termKey="manifest_diff">manifest diff</GlossaryTooltip> over finalized
        outputs. The service may persist a <GlossaryTooltip termKey="comparison_record">comparison record</GlossaryTooltip>{" "}
        for later replay.
      </p>
      {isStaticDemoPayloadFallbackEnabled() ? (
        <>
          <p className="mb-4 mt-4 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <strong>Demo — Claims Intake comparison:</strong>             pick a baseline and target in one tap, then click{" "}
            <strong>Compare</strong>. You can still change reviews from the lists below.
          </p>
          <div className="mb-4 grid max-w-3xl gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-left text-sm shadow-sm transition hover:border-teal-400 hover:bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40 dark:hover:border-teal-700"
              onClick={() => {
                setLeftRunId("claims-intake-run-v1");
                setRightRunId("claims-intake-run-v2");
              }}
            >
              <span className="block font-semibold text-neutral-900 dark:text-neutral-100">
                Baseline: Current Claims Intake
              </span>
              <span className="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">
                Represents the as-is flow before hardening PHI boundaries.
              </span>
            </button>
            <button
              type="button"
              className="rounded-lg border border-violet-200 bg-violet-50/80 p-4 text-left text-sm shadow-sm transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40 dark:hover:border-violet-700"
              onClick={() => {
                setLeftRunId("claims-intake-run-v1");
                setRightRunId("claims-intake-run-v2");
              }}
            >
              <span className="block font-semibold text-neutral-900 dark:text-neutral-100">Updated: Hardened PHI flow</span>
              <span className="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">
                Pair with baseline for sponsor-ready before/after narrative.
              </span>
            </button>
          </div>
        </>
      ) : null}
      <div
        className={cn(
          "flex max-w-3xl flex-col gap-8",
          compareInsightFirstLayout ? "flex-col-reverse" : null,
        )}
      >
      <section className="scroll-mt-8 space-y-4" aria-labelledby="compare-select-heading">
        <h2 id="compare-select-heading" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Select reviews to compare
        </h2>
      <div className="grid max-w-3xl gap-3">
        <RunIdPicker
          preferAutoPick={false}
          label={leftPickerLabel}
          placeholder="Choose a baseline review"
          value={leftRunId}
          onChange={setLeftRunId}
          inputId="compare-left-run-id"
          forCompare
          onRunPicked={setLeftPickedSummary}
        />
        {leftFootnote !== null ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Showing:</span> {leftFootnote}
          </p>
        ) : null}
        <RunIdPicker
          preferAutoPick={false}
          label={rightPickerLabel}
          placeholder="Choose an updated review"
          value={rightRunId}
          onChange={setRightRunId}
          inputId="compare-right-run-id"
          forCompare
          onRunPicked={setRightPickedSummary}
        />
        {rightFootnote !== null ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Showing:</span> {rightFootnote}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            onClick={() => void onCompare()}
            disabled={loading || !leftTrim || !rightTrim}
          >
            {loading ? "Comparing…" : "Compare"}
          </button>
          <button
            type="button"
            className={
              pairAligned && !loading
                ? "rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                : "rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
            }
            onClick={() => void loadAiExplanation()}
            disabled={aiLoading || !leftTrim || !rightTrim}
          >
            {aiLoading ? "Summarizing…" : "Summarize for sponsor"}
          </button>
        </div>
      </div>

      {(!leftTrim || !rightTrim) && <EmptyState {...COMPARE_WAITING} />}
      </section>

      <section className="space-y-6" aria-label="Comparison results">
      {showStaleInputsWarning && (
        <OperatorWarningCallout>
          <strong>Selections no longer match the comparison shown here.</strong>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            The comparison shown reflects{" "}
            <strong>
              {lastComparedPair ? compareRunHeadingLabel(lastComparedPair.left, leftPickedSummary) : ""}
            </strong>{" "}
            →{" "}
            <strong>
              {lastComparedPair ? compareRunHeadingLabel(lastComparedPair.right, rightPickedSummary) : ""}
            </strong>
            . Click{" "}
            <strong>Compare</strong> or <strong>Summarize for sponsor</strong> again after fixing selections, or restore
            the previous values.
          </p>
          <details className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">
              Technical review IDs
            </summary>
            <p className="m-0 mt-1 font-mono">
              {lastComparedPair?.left} → {lastComparedPair?.right}
            </p>
          </details>
        </OperatorWarningCallout>
      )}

      {loading && leftTrim && rightTrim && (
        <OperatorLoadingNotice>
          <strong>Comparing reviews.</strong>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            Comparing reviews — this may take a few seconds.
          </p>
        </OperatorLoadingNotice>
      )}

      {aiLoading && (
        <OperatorLoadingNotice>
          <strong>Requesting AI explanation.</strong>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">This depends on server LLM configuration.</p>
        </OperatorLoadingNotice>
      )}

      {legacyFailure && (
        <>
          <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Supplementary review-level comparison failed.
          </p>
          <OperatorApiProblem failure={legacyFailure} />
          <OperatorTryNext>
            Confirm both reviews exist and are in scope (same tenant/project as the shell). Re-pick reviews from{" "}
            <Link href="/reviews?projectId=default">Reviews</Link> or review detail, then click <strong>Compare</strong> again.
            Use the correlation ID in API logs if you escalate.
          </OperatorTryNext>
        </>
      )}

      {legacyMalformed && (
        <>
          <OperatorMalformedCallout>
            <strong>Supplementary comparison response was not usable.</strong>
            <p className="mt-2">{legacyMalformed}</p>
          </OperatorMalformedCallout>
          <OperatorTryNext>
            Align API and UI versions (<code>GET /version</code>). If the structured summary succeeded below, use that
            section for review while the supplementary comparison is investigated.
          </OperatorTryNext>
        </>
      )}

      {goldenFailure && (
        <>
          <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Manifest comparison request failed.
          </p>
          <OperatorApiProblem failure={goldenFailure} variant="warning" />
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            The supplementary comparison may still have succeeded; check the sections below.
          </p>
          <OperatorTryNext>
            Verify both reviews have finalized reviewed manifests in scope. If only the supplementary diff is needed for
            now, expand <strong>Review-level diff</strong> after confirming the pair in the summary panel.
          </OperatorTryNext>
        </>
      )}

      {goldenMalformed && (
        <>
          <OperatorMalformedCallout>
            <strong>Structured comparison JSON did not match the UI contract.</strong>
            <p className="mt-2">{goldenMalformed}</p>
          </OperatorMalformedCallout>
          <OperatorTryNext>
            Treat this as contract drift—compare deployed API vs UI. The supplementary diff section may still render if
            that response was valid.
          </OperatorTryNext>
        </>
      )}

      {aiFailure && (
        <>
          <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            AI explanation request failed.
          </p>
          <OperatorApiProblem failure={aiFailure} variant="warning" />
          <OperatorTryNext>
            AI is optional—use the structured summary and supplementary tables above for the authoritative diff. If this
            should work, check API LLM configuration, quotas, and proxy timeouts, then retry{" "}
            <strong>Summarize for sponsor</strong>.
          </OperatorTryNext>
        </>
      )}

      {aiMalformed && (
        <>
          <OperatorMalformedCallout>
            <strong>AI explanation response was not usable.</strong>
            <p className="mt-2">{aiMalformed}</p>
          </OperatorMalformedCallout>
          <OperatorTryNext>
            Fall back to structured and supplementary compare. Capture the correlation ID and API version if filing a
            defect.
          </OperatorTryNext>
        </>
      )}

      {hasResultsToNavigate && (
        <nav
          aria-label="Comparison results outline"
          className="mt-4 max-w-3xl rounded-lg border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <strong className="mb-2 block text-neutral-900 dark:text-neutral-100">Review order</strong>
          <ol className="m-0 list-decimal pl-6 leading-relaxed text-neutral-800 dark:text-neutral-200">
            {golden !== null && (
              <li>
                <a href="#compare-structured">Manifest comparison summary</a>
              </li>
            )}
            {result !== null && (
              <li>
                <a href="#compare-technical">Technical details (supplementary diff)</a>
              </li>
            )}
            {aiExplanation !== null && (
              <li>
                <a href="#compare-ai">AI explanation</a>
              </li>
            )}
          </ol>
        </nav>
      )}

      <ClientErrorBoundary title="Comparison results failed to render">
        {golden !== null && (
          <StructuredComparisonView
            golden={golden}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
          />
        )}

        {result !== null ? (
            <details
              id="compare-technical"
              className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-4 dark:border-neutral-600 dark:bg-neutral-900/30"
            >
              <summary className="cursor-pointer text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                Technical details — supplementary review-level comparison
              </summary>
              <div className="mt-4">
                <LegacyRunComparisonView result={result} />
              </div>
            </details>
          ) : null}

        {aiExplanation !== null ? (
          <details
            id="compare-ai"
            className="mt-6 rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-neutral-900 outline-none ring-offset-2 marker:content-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-neutral-100 [&::-webkit-details-marker]:hidden">
              Sponsor narrative (AI-generated) — optional; confirm against structured diff before sign-off
            </summary>
            <div className="border-t border-neutral-200 px-4 pb-2 dark:border-neutral-700">
              <AiComparisonExplanationView explanation={aiExplanation} />
            </div>
          </details>
        ) : null}
      </ClientErrorBoundary>
      </section>
      </div>

      {pairAligned && !loading && lastComparedPair !== null ? (
        <details
          className="mt-6 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50"
          aria-label="Comparison request outcome"
          open={showStaleInputsWarning}
        >
          <summary className="cursor-pointer text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Last compare request (technical)
          </summary>
          <div className="mt-3">
            <p className="mb-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {compareRunHeadingLabel(lastComparedPair.left, leftPickedSummary)}
              </span>
              <span className="mx-1.5 text-neutral-400 dark:text-neutral-500">→</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {compareRunHeadingLabel(lastComparedPair.right, rightPickedSummary)}
              </span>
              <span className="sr-only">
                (technical IDs: {lastComparedPair.left} → {lastComparedPair.right})
              </span>
            </p>
            <dl className="m-0 grid grid-cols-[minmax(10rem,14rem)_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="m-0 text-neutral-500 dark:text-neutral-400">Manifest comparison</dt>
              <dd className="m-0 text-neutral-800 dark:text-neutral-200">
                {outcomeLabel({
                  hasValue: golden !== null,
                  failure: goldenFailure,
                  malformed: goldenMalformed,
                })}
              </dd>
              <dt className="m-0 text-neutral-500 dark:text-neutral-400">Supplementary review / manifest diff</dt>
              <dd className="m-0 text-neutral-800 dark:text-neutral-200">
                {outcomeLabel({
                  hasValue: result !== null,
                  failure: legacyFailure,
                  malformed: legacyMalformed,
                })}
              </dd>
            </dl>
            <p className="mb-0 mt-2.5 text-xs text-neutral-500 dark:text-neutral-400">
              AI explanation is not included here—use <strong>Summarize for sponsor</strong> for that pair.
            </p>
          </div>
        </details>
      ) : null}
    </div>
  );
}

/** Suspense fallback shown while the CompareForm client component is initializing (reading URL params). */
function CompareSuspenseFallback() {
  return (
    <div>
      <OperatorLoadingNotice>
        <strong>Loading compare.</strong>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          Reading <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">leftRunId</code> /{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">rightRunId</code> from the URL so shared compare links open with
          fields prefilled…
        </p>
      </OperatorLoadingNotice>
    </div>
  );
}

/** Compare page entry point. Wraps CompareForm in Suspense for useSearchParams hydration. */
export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSuspenseFallback />}>
      <CompareForm />
    </Suspense>
  );
}
