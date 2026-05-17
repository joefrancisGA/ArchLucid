import Link from "next/link";

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
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { ComparisonExplanation } from "@/types/explanation";
import type { RunComparison, RunSummary } from "@/types/authority";
import type { ComparedPair } from "@/app/(operator)/compare/_sections/compare-page-helpers";

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
    buyerPolished = false,
  } = props;

  const summarizeCue = buyerPolished ? "Summarize for leadership" : "Summarize for sponsor";

  return (
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
            . Click <strong>Compare</strong> or <strong>{summarizeCue}</strong> again after fixing selections, or
            restore the previous values.
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
            <Link href="/reviews?projectId=default">Reviews</Link> or review detail, then click <strong>Compare</strong>{" "}
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

      {hasResultsToNavigate && !buyerPolished ? (
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
            {golden !== null && (
              <li>
                <a href="#compare-raw-manifest-diff">Manifest diff appendix</a>
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
      ) : null}

      <ClientErrorBoundary title="Comparison results failed to render">
        {golden !== null && (
          <StructuredComparisonView
            golden={golden}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
            buyerCompareUi={buyerPolished}
          />
        )}

        {golden !== null ? (
          <CompareRawManifestDiffSection
            baselineRunId={golden.baseRunId}
            updatedRunId={golden.targetRunId}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
          />
        ) : null}

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
