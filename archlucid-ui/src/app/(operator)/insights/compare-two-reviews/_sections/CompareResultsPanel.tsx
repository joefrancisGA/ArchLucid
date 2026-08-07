import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";

import { AiComparisonExplanationView } from "@/components/compare/AiComparisonExplanationView";
import { CompareRawManifestDiffSection } from "@/components/compare/CompareRawManifestDiffSection";
import { LegacyRunComparisonView } from "@/components/compare/LegacyRunComparisonView";
import { StructuredComparisonView } from "@/components/compare/StructuredComparisonView";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorLoadingNotice,
  OperatorMalformedCallout,
  OperatorTryNext,
  OperatorWarningCallout,
} from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { createAndDownloadComparisonPdf } from "@/lib/api";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { ComparisonExplanation } from "@/types/explanation";
import type { RunComparison, RunSummary } from "@/types/authority";
import { BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL } from "@/lib/buyer-polish-copy";
import { CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE } from "@/lib/finding-correlation-vocabulary";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ComparedPair } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-page-helpers";
import { CompareFindingCorrelationSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationSection";
import { CompareGovernanceDiffSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffSection";
import { ComparePairEvidenceCiteStrip } from "@/app/(operator)/insights/compare-two-reviews/_sections/ComparePairEvidenceCiteStrip";

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
  } = props;

  const summarizeCue = buyerPolished ? "Summarize for leadership" : "Summarize for sponsor";

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

  return (
    <section className="space-y-6" aria-label="Comparison results">
      {showPairCiteStrip ? (
        <ComparePairEvidenceCiteStrip baselineRunId={citeBaselineRunId} updatedRunId={citeUpdatedRunId} />
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
          <details className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
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
            Supplementary review-level comparison failed.
          </p>
          <OperatorApiProblem failure={legacyFailure} />
          <OperatorTryNext>
            Confirm both reviews exist and are in scope (same tenant/project as the shell). Re-pick reviews from{" "}
            <Link className={OPERATOR_LINK.nav} href="/architecture/reviews?projectId=default">Reviews</Link> or review detail, then click <strong>Compare</strong>{" "}
            again. Use the correlation ID in API logs if you escalate.
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
          <p className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Review comparison request failed.
          </p>
          <OperatorApiProblem failure={goldenFailure} variant="warning" />
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            The supplementary comparison may still have succeeded; check the sections below.
          </p>
          <OperatorTryNext>
            Verify both reviews have finalized signed review records in scope. If only the supplementary diff is needed for
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
          <p className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            AI explanation request failed.
          </p>
          <OperatorApiProblem failure={aiFailure} variant="warning" />
          <OperatorTryNext>
            AI is optional—use the structured summary and supplementary tables above for the authoritative diff. If this
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
        <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          {!buyerPolished && (
            <nav
              aria-label="Comparison results outline"
              className={cn(
                "w-full max-w-3xl rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              <strong className={cn("mb-2 block text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Review order</strong>
              <ol className={cn("m-0 list-decimal pl-6 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {golden !== null && (
                  <li>
                    <a href="#compare-structured">Review comparison summary</a>
                  </li>
                )}
                {golden !== null && (
                  <li>
                    <a href="#compare-finding-correlation">{CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE}</a>
                  </li>
                )}
                {golden !== null && (
                  <li>
                    <a href="#compare-raw-manifest-diff">Review change details appendix</a>
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
          
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={pdfDownloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {pdfDownloading ? "Generating PDF..." : "Download PDF Report"}
            </Button>
            {pdfError && (
              <p className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>{pdfError}</p>
            )}
          </div>
        </div>
      ) : null}

      <ClientErrorBoundary title="Comparison results failed to render">
        {comparisonNarrativeLoading ? (
          <OperatorLoadingNotice>
            <strong>Generating comparison narrative.</strong>
          </OperatorLoadingNotice>
        ) : null}

        {comparisonNarrative !== null ? (
          <div
            className={cn(
              "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 mb-6 px-4 py-3 leading-relaxed",
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
          />
        )}

        {golden !== null ? (
          <CompareFindingCorrelationSection baselineRunId={golden.baseRunId} targetRunId={golden.targetRunId} />
        ) : null}

        {golden !== null ? (
          <CompareGovernanceDiffSection baselineRunId={golden.baseRunId} targetRunId={golden.targetRunId} />
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
            className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-4 dark:border-neutral-600 dark:bg-neutral-900/30"
          >
            <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              {buyerPolished ? BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL : "Technical details — supplementary review-level comparison"}
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
            <summary className={cn("cursor-pointer list-none px-4 py-3 text-al-text-primary outline-none ring-offset-2 marker:content-none focus-visible:ring-2 focus-visible:ring-teal-600 [&::-webkit-details-marker]:hidden", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              {buyerPolished
                ? "Executive narrative (AI-generated) — optional; confirm against structured summary before sign-off"
                : "Sponsor narrative (AI-generated) — optional; confirm against structured diff before sign-off"}
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
