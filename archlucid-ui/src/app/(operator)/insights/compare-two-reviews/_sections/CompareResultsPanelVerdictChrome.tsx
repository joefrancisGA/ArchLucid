import Link from "next/link";

import { CompareComparisonTrustBanner } from "@/components/compare/CompareComparisonTrustBanner";
import { CompareVerdictSummary } from "@/components/compare/CompareVerdictSummary";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import {
  OperatorLoadingNotice,
  OperatorMalformedCallout,
  OperatorTryNext,
  OperatorWarningCallout,
} from "@/components/operator/OperatorShellMessage";
import { SponsorLensCompareSummaryPanel } from "@/components/compare/SponsorLensCompareSummaryPanel";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { CompareQualityDeltaPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaPanel";
import { CompareProvenanceDeltaBand } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareProvenanceDeltaBand";
import { deriveCompareQualityDeltaFromGolden } from "@/lib/review-quality/compare-quality-delta";
import type { CompareResultsPanelViewModel } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-results-panel";

export function CompareResultsPanelVerdictChrome({
  viewModel,
}: {
  readonly viewModel: CompareResultsPanelViewModel;
}) {
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
    golden,
    summarizeCue,
    liveAnnouncement,
    showTrustBanner,
    trustExecutionModeHonesty,
    usesCurrentEffectiveOnly,
    hasAiNarrative,
    showLoadedComparisonChrome,
    showVerdictSummary,
    verdictSummary,
    findingCorrelationState,
    newFindingTrustLanes,
    result,
  } = viewModel;
  const legacyCompareBlockedReason = compareRunPairBlockedReason(legacyFailure);
  const goldenCompareBlockedReason = compareRunPairBlockedReason(goldenFailure);

  return (
    <>
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
          governanceDiff={viewModel.governanceDiffState.view}
        />
      ) : null}

      {showVerdictSummary && golden !== null ? (
        <CompareVerdictSummary
          golden={golden}
          baselinePickedSummary={leftPickedSummary}
          updatedPickedSummary={rightPickedSummary}
        />
      ) : null}

      {golden !== null ? (
        <CompareProvenanceDeltaBand
          baselineRunId={golden.baseRunId}
          targetRunId={golden.targetRunId}
          baselinePickedSummary={leftPickedSummary}
          targetPickedSummary={rightPickedSummary}
          manifestDiffs={result?.manifestComparison?.diffs}
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
            {legacyCompareBlockedReason ?? "Detailed comparison unavailable."}
          </p>
          {legacyCompareBlockedReason === null ? (
            <OperatorApiProblem failure={legacyFailure} />
          ) : (
            <OperatorWarningCallout>{legacyCompareBlockedReason}</OperatorWarningCallout>
          )}
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {legacyCompareBlockedReason === null
              ? "The structured summary below may still be available while this detailed diff is retried."
              : "Commit both reviews and verify sealed manifest integrity before comparing again."}
          </p>
          <OperatorTryNext>
            {legacyCompareBlockedReason === null ? (
              <>
                Confirm both reviews exist and are in scope (same tenant/project as the shell). Re-pick reviews from{" "}
                <Link className={OPERATOR_LINK.nav} href="/architecture/reviews">Reviews</Link> or review detail, then click <strong>Compare</strong>{" "}
                again. Use the correlation ID in API logs if you escalate.
              </>
            ) : (
              <>
                Open each review detail page and confirm authority lifecycle is <strong>Complete</strong> with a verified sealed manifest.
                Re-run compare after both sides pass export gates.
              </>
            )}
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
            {goldenCompareBlockedReason ?? "Review comparison request failed."}
          </p>
          {goldenCompareBlockedReason === null ? (
            <OperatorApiProblem failure={goldenFailure} variant="warning" />
          ) : (
            <OperatorWarningCallout>{goldenCompareBlockedReason}</OperatorWarningCallout>
          )}
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {goldenCompareBlockedReason === null
              ? "The detailed comparison may still have succeeded; check the sections below."
              : "Structured compare is blocked until both reviews pass lifecycle and sealed-manifest gates."}
          </p>
          <OperatorTryNext>
            {goldenCompareBlockedReason === null ? (
              <>
                Verify both reviews have finalized sealed review records in scope. If only the detailed diff is needed for
                now, expand <strong>Review-level diff</strong> after confirming the pair in the summary panel.
              </>
            ) : (
              <>
                Resolve lifecycle or sealed-manifest gaps on the blocked review(s), then click <strong>Compare</strong> again.
              </>
            )}
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
            Treat this as contract drift — compare deployed API vs UI. The supplementary diff section may still render if
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
            AI is optional — use the structured summary and supplementary tables above for the authoritative diff. If this
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
    </>
  );
}
