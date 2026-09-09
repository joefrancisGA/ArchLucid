"use client";

import { Button } from "@/components/ui/button";
import type { UseReviewPresenterElicitationResult } from "@/hooks/use-review-presenter-elicitation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { listPresenterAssertedAnswerEntries } from "@/lib/reviews/review-presenter-asserted-trail";
import {
  REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING,
  REVIEW_PRESENTER_RECORDED_ASSERTED_LABEL,
  reviewPresenterAssertedCaptureLine,
} from "@/lib/reviews/review-presenter-elicitation-copy";
import { cn } from "@/lib/utils";

import { ReviewPresenterElicitationActions } from "@/components/reviews/ReviewPresenterElicitationActions";

export type ReviewRoomElicitationPanelProps = {
  readonly elicitation: UseReviewPresenterElicitationResult;
  readonly onExit?: () => void;
};

/** Inline Working room elicitation — default layout, no projector zoom (DR-16). */
export function ReviewRoomElicitationPanel(
  props: ReviewRoomElicitationPanelProps,
): React.JSX.Element {
  const { elicitation, onExit } = props;

  return (
    <section
      className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="review-room-elicitation-panel"
      aria-label="Room elicitation"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{elicitation.title}</h2>
          {elicitation.readyToFinalize ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              No pending MUST or SHOULD questions. Return to the review to finalize when the package is ready.
            </p>
          ) : elicitation.primaryQuestion !== null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {elicitation.primaryQuestion.tier} question — mediate yes, no, or ask for another question.
            </p>
          ) : null}
        </div>
        {onExit !== undefined ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="review-room-elicitation-exit"
            onClick={onExit}
          >
            Exit room
          </Button>
        ) : null}
      </div>

      {elicitation.lastRecordedEntry !== null ? (
        <p
          className={cn("m-0 font-medium text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.body)}
          data-testid="review-presenter-recorded-asserted"
        >
          {REVIEW_PRESENTER_RECORDED_ASSERTED_LABEL}
          {" "}
          {reviewPresenterAssertedCaptureLine(
            elicitation.lastRecordedEntry.questionKey,
            elicitation.lastRecordedEntry.answer,
            elicitation.lastRecordedEntry.responderLabel,
          )}
        </p>
      ) : null}

      {listPresenterAssertedAnswerEntries(elicitation.transparencyTrail).length > 0 ? (
        <div className="space-y-2" data-testid="review-presenter-asserted-trail">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING}
          </h3>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {listPresenterAssertedAnswerEntries(elicitation.transparencyTrail).map((entry) => (
              <li key={entry.key} className={OPERATOR_TYPOGRAPHY.helper}>
                {entry.value}
                {entry.responderLabel ? ` — ${entry.responderLabel}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <ReviewPresenterElicitationActions elicitation={elicitation} />
      </div>
    </section>
  );
}
