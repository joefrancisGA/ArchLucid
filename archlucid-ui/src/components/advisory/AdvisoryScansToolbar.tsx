"use client";

import Link from "next/link";

import { AdvisoryScanForm } from "@/components/advisory/AdvisoryScanForm";
import { AdvisoryScansPickReviewBeforeScanningStrip } from "@/components/advisory/AdvisoryScansPickReviewBeforeScanningStrip";
import { Button } from "@/components/ui/button";
import {
  ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF,
  ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL,
  ADVISORY_SCANS_VIEW_SAMPLE_LABEL,
} from "@/lib/advisory-copy";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { AdvisoryScansContentState } from "./use-advisory-scans-content";

type AdvisoryScansToolbarProps = {
  readonly content: AdvisoryScansContentState;
};

export function AdvisoryScansToolbar(props: AdvisoryScansToolbarProps): React.JSX.Element {
  const { content } = props;

  return (
    <>
      {content.runId.trim().length === 0 ? (
        <AdvisoryScansPickReviewBeforeScanningStrip selectedReviewId="" onSelectReview={content.onPickReview} />
      ) : (
        <>
          <p
            className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="advisory-scans-run-scope-banner"
          >
            {"Scanning advisory recommendations for review "}
            <span className="font-mono text-al-text-primary">{content.bootstrappedRunId}</span>
            {" · "}
            <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={content.scansClearScopeHref}>
              Clear review scope
            </Link>
            {" · "}
            <Link
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
              href={`/architecture/reviews/${encodeURIComponent(content.bootstrappedRunId)}`}
            >
              Open review
            </Link>
          </p>
          <AdvisoryScanForm
            bootstrappedRunId={content.bootstrappedRunId}
            urlScopedRunId={content.runId}
            reviewSelected={content.reviewSelected}
            loading={content.loading}
            runId={content.runId}
            setRunId={content.setRunId}
            compareToRunId={content.compareToRunId}
            setCompareToRunId={content.setCompareToRunId}
            isAdminCaller={content.isAdminCaller}
            advisoryScanChecklistSteps={content.advisoryScanChecklistSteps}
            advisoryScanChecklistEmphasizedStepId={content.advisoryScanChecklistEmphasizedStepId}
            generateDisabledHintId={content.generateDisabledHintId}
            generateDisabledReason={content.generateDisabledReason}
            onGenerate={() => {
              void content.loadAdvice();
            }}
            onRefreshSaved={() => {
              void content.refreshPersistedOnly();
            }}
          />
        </>
      )}

      {!content.hasResults ? (
        <div className="mb-6 flex flex-wrap items-center gap-2" data-testid="advisory-scans-empty-actions">
          <Button
            type="button"
            size="sm"
            variant="outline"
            id={content.samplePreviewTriggerId}
            aria-expanded={content.showSamplePreview}
            aria-controls={content.samplePreviewRegionId}
            data-testid="advisory-empty-view-sample-cta"
            onClick={content.toggleSamplePreview}
          >
            {ADVISORY_SCANS_VIEW_SAMPLE_LABEL}
          </Button>

          <Button asChild size="sm" variant="outline">
            <Link
              href={ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF}
              data-testid="advisory-empty-open-reviews-link"
            >
              {ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL}
            </Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
