import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileText } from "lucide-react";

import { AiComparisonExplanationView } from "@/components/compare/AiComparisonExplanationView";
import { CompareComparisonTrustBanner } from "@/components/compare/CompareComparisonTrustBanner";
import { CompareRawManifestDiffSection } from "@/components/compare/CompareRawManifestDiffSection";
import { CompareResultsSectionNav } from "@/components/compare/CompareResultsSectionNav";
import { SponsorLensCompareSummaryPanel } from "@/components/compare/SponsorLensCompareSummaryPanel";
import { CompareVerdictSummary } from "@/components/compare/CompareVerdictSummary";
import { LegacyRunComparisonView } from "@/components/compare/LegacyRunComparisonView";
import { StructuredComparisonView } from "@/components/compare/StructuredComparisonView";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import {
  OperatorLoadingNotice,
  OperatorMalformedCallout,
  OperatorTryNext,
  OperatorWarningCallout,
} from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { createAndDownloadComparisonPdf, getArchitecturePackageDocxUrl } from "@/lib/api";
import { buildCompareVerdictSummary } from "@/lib/build-compare-verdict-summary";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { ComparisonExplanation } from "@/types/explanation";
import type { RunComparison, RunSummary } from "@/types/authority";
import { BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ComparedPair } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import { CompareFindingCorrelationSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationSection";
import { CompareGovernanceDiffSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffSection";
import { CompareQualityDeltaPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaPanel";
import { ComparePairEvidenceCiteStrip } from "@/app/(operator)/insights/compare-two-reviews/_sections/ComparePairEvidenceCiteStrip";
import { CompareExecutionModeHonestyStrip } from "@/components/compare/CompareExecutionModeHonestyStrip";
import { resolveCompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import {
  buildCompareNewFindingTrustLaneRows,
  deriveCompareQualityDeltaFromGolden,
} from "@/lib/review-quality/compare-quality-delta";
import { useCompareGovernanceDiff } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareGovernanceDiff";
import { useCompareFindingCorrelation } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFindingCorrelation";

export type CompareResultsPanelProps = {
  showStaleInputsWarning: boolean;
  lastComparedPair: ComparedPair | null;
  leftPickedSummary: RunSummary | null;
  rightPickedSummary: RunSummary | null;
  loading: boolean;
  leftTrim: string;
  rightTrim: string;
  aiLoading: boolean;
  legacyFailure: ApiLoadFailureState | null;
  legacyMalformed: string | null;
  goldenFailure: ApiLoadFailureState | null;
  goldenMalformed: string | null;
  aiFailure: ApiLoadFailureState | null;
  aiMalformed: string | null;
  hasResultsToNavigate: boolean;
  golden: GoldenManifestComparison | null;
  result: RunComparison | null;
  aiExplanation: ComparisonExplanation | null;
  comparisonNarrative: string | null;
  comparisonNarrativeLoading: boolean;
  /** Buyer shell: softer labels, collapsed technical outline, collapsed structured folds by default. */
  buyerPolished?: boolean;
  /** Places results above collapsed pickers in buyer insight-first layout. */
  resultsFirst?: boolean;
};

export function CompareResultsPanel(props: CompareResultsPanelProps) {
  const {
    showStaleInputsWarning,
    lastComparedPair,
    leftPickedSummary,
    rightPickedSummary,
    loading,
    leftTrim,
    rightTrim,
    aiLoading,
    legacyFailure,
    legacyMalformed,
    goldenFailure,
    goldenMalformed,
    aiFailure,
    aiMalformed,
    hasResultsToNavigate,
    golden,
    result,
    aiExplanation,
    comparisonNarrative,
    comparisonNarrativeLoading,
    buyerPolished = false,
    resultsFirst = false,
  } = props;

  const summarizeCue = buyerPolished ? "Summarize for leadership" : "Summarize for sponsor";
  const resultsRegionRef = useRef<HTMLElement>(null);
  const lastAnnouncedPairRef = useRef<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    if (!lastComparedPair) return;
    setPdfDownloading(true);
    setPdfError(null);
    try {
      await createAndDownloadComparisonPdf(lastComparedPair.left, lastComparedPair.right);
    } catch (e: unknown) {
      setPdfError(e instanceof Error ? e.message : "Failed to download PDF report.");
    } finally {
      setPdfDownloading(false);
    }
  };

  const citeBaselineRunId = lastComparedPair?.left ?? leftTrim;
  const citeUpdatedRunId = lastComparedPair?.right ?? rightTrim;
  const showPairCiteStrip =
    hasResultsToNavigate && citeBaselineRunId.trim().length > 0 && citeUpdatedRunId.trim().length > 0;
  const executionModeHonesty = resolveCompareExecutionModeHonesty(leftPickedSummary, rightPickedSummary);
  const showExecutionModeHonesty =
    hasResultsToNavigate &&
    citeBaselineRunId.trim().length > 0 &&
    citeUpdatedRunId.trim().length > 0 &&
    (leftPickedSummary !== null || rightPickedSummary !== null);

  const governanceDiffState = useCompareGovernanceDiff(
    golden !== null ? golden.baseRunId : null,
    golden !== null ? golden.targetRunId : null,
  );
  const findingCorrelationState = useCompareFindingCorrelation(
    golden !== null ? golden.baseRunId : null,
    golden !== null ? golden.targetRunId : null,
  );
  const newFindingTrustLanes =
    golden !== null ? buildCompareNewFindingTrustLaneRows(findingCorrelationState.lifecycleRecords) : [];
  const usesCurrentEffectiveOnly = governanceDiffState.view?.usesCurrentEffectiveOnly === true;
  const hasAiNarrative = comparisonNarrative !== null || aiExplanation !== null;
  // Keep trust + verdict tied to loaded golden results, not picker match — otherwise
  // stale-selection warnings hide governance honesty while the governance panel still renders.
  const showLoadedComparisonChrome = golden !== null;
  const trustExecutionModeHonesty = showStaleInputsWarning ? null : executionModeHonesty;
  const showTrustBanner = showLoadedComparisonChrome;
  const showVerdictSummary = showLoadedComparisonChrome;
  const verdictSummary = golden !== null ? buildCompareVerdictSummary(golden) : null;

  useEffect(() => {
    if (loading || verdictSummary === null || lastComparedPair === null) {
      return;
    }

    const pairKey = `${lastComparedPair.left}::${lastComparedPair.right}`;

    if (lastAnnouncedPairRef.current === pairKey) {
      return;
    }

    lastAnnouncedPairRef.current = pairKey;
    setLiveAnnouncement(`Comparison loaded. ${verdictSummary.totalChanges} total changes.`);

    window.requestAnimationFrame(() => {
      resultsRegionRef.current?.focus();
    });
  }, [loading, verdictSummary, lastComparedPair]);

  const docxHref =
    golden !== null
      ? getArchitecturePackageDocxUrl(golden.baseRunId, golden.targetRunId, {
          includeComparisonExplanation: true,
        })
      : null;

  return (
    <section
      ref={resultsRegionRef}
      tabIndex={-1}
      className={cn("space-y-4 outline-none", resultsFirst && "order-1")}
      aria-label="Comparison results"
      data-testid="compare-results-region"
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="compare-results-live-region">
        {liveAnnouncement}
      </div>
      {showTrustBanner ? (
        <CompareComparisonTrustBanner
          executionModeHonesty={trustExecutionModeHonesty}
          usesCurrentEffectiveOnly={usesCurrentEffectiveOnly}
          hasAiNarrative={hasAiNarrative}
        />
      ) : null}

      {showLoadedComparisonChrome ? (
        <SponsorLensCompareSummaryPanel
          golden={golden}
          executionModeHonesty={trustExecutionModeHonesty}
          governanceDiff={governanceDiffState.view}
        />
      ) : null}

      {showVerdictSummary ? (
        <CompareVerdictSummary
          golden={golden}
          baselinePickedSummary={leftPickedSummary}
          updatedPickedSummary={rightPickedSummary}
        />
      ) : null}

      {golden !== null ? (
        <CompareQualityDeltaPanel
          counts={
            findingCorrelationState.compareQualityDelta ?? deriveCompareQualityDeltaFromGolden(golden)
          }
          newFindingTrustLanes={newFindingTrustLanes}
        />
      ) : null}

      {showStaleInputsWarning && (
        <OperatorWarningCallout>
          <strong>Selections no longer match the comparison shown here.</strong>
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            The comparison shown reflects{" "}
            <strong>
              {lastComparedPair ? compareRunHeadingLabel(lastComparedPair.left, leftPickedSummary) : ""}
            </strong>{" "}
            →{" "}
            <strong>
              {lastComparedPair ? compareRunHeadingLabel(lastComparedPair.right, rightPickedSummary) : ""}
            </strong>
            . Click <strong>Compare</strong> or <strong>{summarizeCue}</strong> again after fixing selections, or
            restore the previous values.
          </p>
          <details className={cn("group mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <summary className={cn("flex cursor-pointer items-center gap-2 font-medium text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              <DisclosureTriangleIndicator />
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
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Comparing reviews — this may take a few seconds.
          </p>
        </OperatorLoadingNotice>
      )}

      {aiLoading && (
        <OperatorLoadingNotice>
          <strong>Requesting AI explanation.</strong>
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>This depends on server LLM configuration.</p>
        </OperatorLoadingNotice>
      )}

      {legacyFailure && (
        <>
          <p className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Detailed comparison unavailable.
          </p>
          <OperatorApiProblem failure={legacyFailure} />
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            The structured summary below may still be available while this detailed diff is retried.
          </p>
          <OperatorTryNext>
            Confirm both reviews exist and are in scope (same tenant/project as the shell). Re-pick reviews from{" "}
            <Link className={OPERATOR_LINK.nav} href="/architecture/reviews">Reviews</Link> or review detail, then click <strong>Compare</strong>{" "}
            again. Use the correlation ID in API logs if you escalate.
          </OperatorTryNext>
        </>
      )}

      {legacyMalformed && (
        <>
          <OperatorMalformedCallout>
            <strong>Detailed comparison response was not usable.</strong>
            <p className="mt-2">{legacyMalformed}</p>
          </OperatorMalformedCallout>
          <OperatorTryNext>
            Align API and UI versions (<code>GET /version</code>). If the structured summary succeeded below, use that
            section for review while the detailed comparison is investigated.
          </OperatorTryNext>
        </>
      )}

      {goldenFailure && (
        <>
          <p className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Review comparison request failed.
          </p>
          <OperatorApiProblem failure={goldenFailure} variant="warning" />
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            The detailed comparison may still have succeeded; check the sections below.
          </p>
          <OperatorTryNext>
            Verify both reviews have finalized sealed review records in scope. If only the detailed diff is needed for
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
            Treat this as contract drif — ompare deployed API vs UI. The supplementary diff section may still render if
            that response was valid.
          </OperatorTryNext>
        </>
      )}

      {aiFailure && (
        <>
          <p className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            AI explanation request failed.
          </p>
          <OperatorApiProblem failure={aiFailure} variant="warning" />
          <OperatorTryNext>
            AI is optiona — se the structured summary and supplementary tables above for the authoritative diff. If this
            should work, check API LLM configuration, quotas, and proxy timeouts, then retry{" "}
            <strong>{summarizeCue}</strong>.
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

      {hasResultsToNavigate ? (
        <div
          className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
          data-testid="compare-results-action-bar"
        >
          <CompareResultsSectionNav
            showStructured={golden !== null}
            showFindingCorrelation={golden !== null}
            showGovernanceDiff={golden !== null}
            showRawManifestDiff={golden !== null}
            showTechnicalAppendix={result !== null}
            showAiExplanation={aiExplanation !== null}
            buyerPolished={buyerPolished}
            className="flex-1"
          />
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row lg:items-end">
            {docxHref !== null ? (
              <a
                href={docxHref}
                rel="noreferrer"
                className={cn(OPERATOR_LINK.inline, "inline-flex items-center gap-1.5 text-sm")}
                data-testid="compare-download-docx-button"
              >
                <FileText className="h-4 w-4" aria-hidden />
                Download DOCX package
              </a>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfDownloading}
              data-testid="compare-download-pdf-button"
            >
              <Download className="h-4 w-4" />
              {pdfDownloading ? "Generating PDF…" : "Download PDF report"}
            </Button>
            {pdfError ? (
              <p role="alert" className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
                {pdfError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {showPairCiteStrip ? (
        <ComparePairEvidenceCiteStrip baselineRunId={citeBaselineRunId} updatedRunId={citeUpdatedRunId} />
      ) : null}

      <ClientErrorBoundary title="Comparison results failed to render">
        {showExecutionModeHonesty ? (
          <CompareExecutionModeHonestyStrip
            baselineRunId={citeBaselineRunId}
            updatedRunId={citeUpdatedRunId}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
          />
        ) : null}

        {comparisonNarrativeLoading ? (
          <OperatorLoadingNotice>
            <strong>Generating comparison narrative.</strong>
          </OperatorLoadingNotice>
        ) : null}

        {comparisonNarrative !== null ? (
          <div
            className={cn(
              "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3 leading-relaxed",
              OPERATOR_TYPOGRAPHY.body,
            )}
            role="status"
            data-testid="compare-ask-narrative-banner"
          >
            <p className={cn("m-0 mb-1 uppercase tracking-wide text-teal-800 dark:text-teal-200", OPERATOR_NAV_GROUP_LABEL)}>
              ✦ AI narrative
            </p>
            <p className="m-0 whitespace-pre-wrap">{comparisonNarrative}</p>
          </div>
        ) : null}

        {golden !== null && (
          <StructuredComparisonView
            golden={golden}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
            buyerCompareUi={buyerPolished}
            summaryHighlightsForFold={verdictSummary?.summaryHighlightsForFold}
          />
        )}

        {golden !== null ? (
          <CompareFindingCorrelationSection baselineRunId={golden.baseRunId} targetRunId={golden.targetRunId} />
        ) : null}

        {golden !== null ? (
          <CompareGovernanceDiffSection
            baselineRunId={golden.baseRunId}
            targetRunId={golden.targetRunId}
            preloaded={governanceDiffState}
            baselineRequestId={leftPickedSummary?.requestId}
            targetRequestId={rightPickedSummary?.requestId}
          />
        ) : null}

        {golden !== null ? (
          <CompareRawManifestDiffSection
            baselineRunId={golden.baseRunId}
            updatedRunId={golden.targetRunId}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
            buyerPolished={buyerPolished}
          />
        ) : null}

        {result !== null ? (
          <details
            id="compare-technical"
            className="group mt-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-4 dark:border-neutral-600 dark:bg-neutral-900/30"
          >
            <summary className={cn("flex cursor-pointer items-center gap-2 text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              <DisclosureTriangleIndicator />
              <h2 className={cn("m-0 inline text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {buyerPolished ? BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL : "Technical details — supplementary review-level comparison"}
              </h2>
            </summary>
            <div className="mt-4">
              <LegacyRunComparisonView result={result} />
            </div>
          </details>
        ) : null}

        {aiExplanation !== null ? (
          <details
            id="compare-ai"
            className="group mt-6 rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
          >
            <summary className={cn("flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-al-text-primary outline-none ring-offset-2 marker:content-none focus-visible:ring-2 focus-visible:ring-teal-600 [&::-webkit-details-marker]:hidden", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              <DisclosureTriangleIndicator />
              <h2 className={cn("m-0 inline text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {buyerPolished
                  ? "Sponsor narrative (AI-generated)"
                  : "Sponsor narrative (AI-generated)"}
              </h2>
            </summary>
            <div className="border-t border-neutral-200 px-4 pb-2 dark:border-neutral-700">
              <AiComparisonExplanationView explanation={aiExplanation} />
            </div>
          </details>
        ) : null}
      </ClientErrorBoundary>
    </section>
  );
}
