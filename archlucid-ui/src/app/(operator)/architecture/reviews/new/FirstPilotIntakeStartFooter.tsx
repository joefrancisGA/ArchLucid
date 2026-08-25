"use client";

import type { ReactNode } from "react";

import { ReviewPathTimeEstimateBanner } from "@/components/ReviewPathTimeEstimateBanner";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { ReviewStartUnresolvedNotice } from "@/components/review-intake/ReviewStartUnresolvedNotice";
import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import type { WizardSessionSaveState } from "@/hooks/use-wizard-session-persistence";
import type { ReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";
import { cn } from "@/lib/utils";

export type FirstPilotIntakeStartFooterProps = {
  readonly writeDestination: string;
  readonly intakeGap: string | null;
  readonly creationProgress: ReviewCreationProgress;
  readonly clientValidationMessage: string | null;
  readonly wizardSaveState: WizardSessionSaveState;
  readonly blocksLlmExecution: boolean;
  readonly onStartReview: () => void;
  readonly onRecheckUnresolved: () => void;
};

/**
 * Final start-review zone — separates meta, validation, and the primary CTA from intake fields above.
 */
export function FirstPilotIntakeStartFooter(props: FirstPilotIntakeStartFooterProps): React.JSX.Element {
  const {
    writeDestination,
    intakeGap,
    creationProgress,
    clientValidationMessage,
    wizardSaveState,
    blocksLlmExecution,
    onStartReview,
    onRecheckUnresolved,
  } = props;

  const readinessId = intakeGap !== null ? "first-pilot-readiness" : undefined;
  const preActionNotices: ReactNode[] = [];

  if (clientValidationMessage !== null) {
    preActionNotices.push(
      <ReviewStartInlineError
        key="validation-error"
        message={clientValidationMessage}
        testId="first-pilot-validation-error"
      />,
    );
  }

  if (creationProgress.outcome?.kind === "failed") {
    preActionNotices.push(
      <ReviewStartInlineError
        key="submit-error"
        message={creationProgress.outcome.message}
        testId="first-pilot-submit-error"
      />,
    );
  }

  const postActionNotices: ReactNode[] = [];

  if (creationProgress.showStagedPanel && creationProgress.activeStageId !== null) {
    postActionNotices.push(
      <ReviewStartStagedProgress
        key="staged-progress"
        stages={creationProgress.stages}
        activeStageId={creationProgress.activeStageId}
        headline={REVIEW_START_PREPARING_LABEL}
        detail={creationProgress.waitCopy?.detail ?? null}
        testId="first-pilot-review-start-progress"
      />,
    );
  }

  if (creationProgress.outcome?.kind === "unresolved") {
    postActionNotices.push(
      <ReviewStartUnresolvedNotice
        key="unresolved-notice"
        onRecheck={onRecheckUnresolved}
        isRechecking={creationProgress.isRechecking}
        testId="first-pilot-unresolved-notice"
      />,
    );
  }

  return (
    <div
      className="space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      data-testid="first-pilot-start-footer"
    >
      <div className="space-y-1" data-testid="first-pilot-start-meta">
        <ReviewPathTimeEstimateBanner pathId="quick-review" presentation="inline" />
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="first-pilot-write-destination"
        >
          {writeDestination}
        </p>
        {intakeGap !== null ? (
          <p
            id={readinessId}
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="first-pilot-readiness"
            role="status"
          >
            {intakeGap}
          </p>
        ) : null}
      </div>

      {preActionNotices.length > 0 ? <div className="space-y-3">{preActionNotices}</div> : null}

      <div className="space-y-3" data-testid="first-pilot-start-actions">
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="first-pilot-intake-action-row"
        >
          <WizardSessionSaveStatus layout="inline" saveState={wizardSaveState} />
          <ReviewStartLoadingButton
            type="button"
            variant="primary"
            className={CTA_WIDTH.content}
            disabled={creationProgress.isActive || blocksLlmExecution}
            onClick={onStartReview}
            data-testid="first-pilot-start"
            idleLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
            loadingLabel={creationProgress.loadingLabel}
            isLoading={creationProgress.isActive}
            aria-describedby={readinessId}
          />
        </div>
        <NewReviewSampleEscapeLink presentation="inline" />
      </div>

      {postActionNotices.length > 0 ? <div className="space-y-3">{postActionNotices}</div> : null}
    </div>
  );
}
