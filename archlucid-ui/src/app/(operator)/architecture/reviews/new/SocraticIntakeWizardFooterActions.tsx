"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_REVIEW_ANSWERS_DISABLED_HINT,
  guidedIntakeClarificationsAnsweredCounter,
  resolveGuidedIntakeClarificationsDoneLabel,
} from "@/lib/guided-intake-copy";
import {
  WIZARD_STICKY_FOOTER_CLASS,
  WIZARD_STICKY_FOOTER_TEST_ID,
} from "@/lib/wizard-sticky-progress";

export type SocraticIntakeWizardFooterActionsProps = {
  readonly handledClarificationCount: number;
  readonly totalRequiredClarifications: number;
  readonly allClarificationsHandled: boolean;
  readonly canReviewAnswers: boolean;
  readonly busy: boolean;
  readonly isSubmitBlocked: boolean;
  readonly pendingQuestionCount: number;
  readonly onReviewAnswers: () => void;
  readonly onAdvanceToConfirm: () => void;
};

/** Sticky footer for the guided-intake clarifications step (answered counter + continue CTA). */
export function SocraticIntakeWizardFooterActions(
  props: SocraticIntakeWizardFooterActionsProps,
): React.JSX.Element {
  return (
    <div className={WIZARD_STICKY_FOOTER_CLASS} data-testid={WIZARD_STICKY_FOOTER_TEST_ID}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p
            className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
            data-testid="socratic-clarifications-answered-counter"
          >
            {guidedIntakeClarificationsAnsweredCounter(
              props.handledClarificationCount,
              props.totalRequiredClarifications,
            )}
          </p>
          {!props.allClarificationsHandled ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="socratic-review-answers-hint">
              {GUIDED_INTAKE_REVIEW_ANSWERS_DISABLED_HINT}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={!props.canReviewAnswers || props.isSubmitBlocked}
          onClick={() => {
            if (props.isSubmitBlocked) {
              return;
            }

            if (props.pendingQuestionCount === 0) {
              props.onAdvanceToConfirm();

              return;
            }

            props.onReviewAnswers();
          }}
          data-testid="socratic-questions-done"
        >
          {resolveGuidedIntakeClarificationsDoneLabel(props.allClarificationsHandled, props.busy)}
        </Button>
      </div>
    </div>
  );
}
