"use client";

import { AdvisoryRecommendationCard } from "@/components/advisory/AdvisoryRecommendationCard";
import { AdvisoryRecommendationDispositionDialog } from "@/components/advisory/AdvisoryRecommendationDispositionDialog";
import { AdvisorySampleRecommendationPreview } from "@/components/advisory/AdvisorySampleRecommendationPreview";
import { AdvisoryScanSummaryPanel } from "@/components/advisory/AdvisoryScanSummaryPanel";
import { AdvisoryScansTriageFirstPendingStrip } from "@/components/advisory/AdvisoryScansTriageFirstPendingStrip";
import { RecommendationImproveLoopEvidencePanel } from "@/components/advisory/RecommendationImproveLoopEvidencePanel";
import {
  ADVISORY_SCANS_RECOMMENDATIONS_SECTION_BODY,
  ADVISORY_SCANS_RECOMMENDATIONS_SECTION_TITLE,
} from "@/lib/advisory-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { dispositionActionLabel, type AdvisoryScansContentState } from "./use-advisory-scans-content";

type AdvisoryScansResultsPanelProps = {
  readonly content: AdvisoryScansContentState;
};

export function AdvisoryScansResultsPanel(props: AdvisoryScansResultsPanelProps): React.JSX.Element {
  const { content } = props;

  return (
    <>
      {content.hasResults ? <AdvisoryScanSummaryPanel summary={content.scanSummary} /> : null}

      {content.planSummary !== null && content.planSummary.summaryNotes.length > 0 ? (
        <section className="mb-6 space-y-2">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Scan notes
          </h3>
          <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
            {content.planSummary.summaryNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.lastImproveLoopEvidence !== null ? (
        <RecommendationImproveLoopEvidencePanel evidence={content.lastImproveLoopEvidence} />
      ) : null}

      {content.recommendations.length > 0 ? (
        <section className="space-y-4" data-testid="advisory-recommendations-list">
          {content.triageFirstPending !== null ? (
            <AdvisoryScansTriageFirstPendingStrip
              target={content.triageFirstPending}
              onReviewRecommendation={(recommendationId) => {
                content.setDispositionError(null);
                content.setPendingDisposition({ recommendationId, action: "Accept" });
              }}
            />
          ) : null}
          <div className="space-y-1">
            <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {ADVISORY_SCANS_RECOMMENDATIONS_SECTION_TITLE}
            </h3>
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {ADVISORY_SCANS_RECOMMENDATIONS_SECTION_BODY}
            </p>
          </div>

          <div className="grid gap-4">
            {content.recommendations.map((recommendation) => (
              <AdvisoryRecommendationCard
                key={recommendation.recommendationId}
                recommendation={recommendation}
                onAction={(recommendationId, action) => {
                  content.setDispositionError(null);
                  content.setPendingDisposition({ recommendationId, action });
                }}
              />
            ))}
          </div>
        </section>
      ) : content.planSummary !== null && content.recommendations.length === 0 ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          No persisted recommendations returned for this architecture review.
        </p>
      ) : null}

      {content.showSamplePreview ? (
        <div
          ref={content.samplePreviewRegionRef}
          id={content.samplePreviewRegionId}
          tabIndex={-1}
          className="mt-4 space-y-3 outline-none"
          data-testid="advisory-sample-preview-region"
          aria-labelledby={content.samplePreviewTriggerId}
        >
          <AdvisorySampleRecommendationPreview />
        </div>
      ) : null}

      <AdvisoryRecommendationDispositionDialog
        open={content.pendingDisposition !== null}
        onOpenChange={(open) => {
          if (!open && !content.dispositionBusy) {
            content.setPendingDisposition(null);
            content.setDispositionError(null);
          }
        }}
        actionLabel={
          content.pendingDisposition !== null ? dispositionActionLabel(content.pendingDisposition.action) : null
        }
        busy={content.dispositionBusy}
        errorMessage={content.dispositionError}
        onConfirm={(comment, rationale) => {
          void content.submitDisposition(comment, rationale);
        }}
      />
    </>
  );
}
